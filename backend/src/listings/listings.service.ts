import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing, ListingImage, Category } from '../entities';
import { CreateListingDto } from './dto/create-listing.dto';
import { DEFAULT_PAGE_LIMIT } from '../common/constants';
import { UpdateListingDto } from './dto/update-listing.dto';

type ListingViewer = {
  id: number;
  role: string;
};

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing)
    private listingsRepository: Repository<Listing>,
    @InjectRepository(ListingImage)
    private imagesRepository: Repository<ListingImage>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async create(sellerId: number, createDto: CreateListingDto) {
    // Validate category exists
    const category = await this.categoriesRepository.findOne({
      where: { id: createDto.categoryId },
    });
    if (!category) {
      throw new BadRequestException('Invalid category');
    }

    // Validate bid end date is in the future
    if (createDto.bidEndDate && new Date(createDto.bidEndDate) <= new Date()) {
      throw new BadRequestException('Bid end date must be in the future');
    }

    const listing = new Listing();
    listing.sellerId = sellerId;
    listing.title = createDto.title;
    listing.description = createDto.description;
    listing.price = createDto.price;
    listing.categoryId = createDto.categoryId;
    listing.listingType = createDto.listingType || 'fixed';
    listing.conditionStatus = createDto.conditionStatus || 'good';
    if (createDto.bidEndDate) {
      listing.bidEndDate = new Date(createDto.bidEndDate);
    }

    const saved = await this.listingsRepository.save(listing);

    if (createDto.imageUrls?.length) {
      const images = createDto.imageUrls.map((url, index) =>
        this.imagesRepository.create({
          listingId: saved.id,
          imageUrl: url,
          isPrimary: index === 0,
          sortOrder: index,
        }),
      );
      await this.imagesRepository.save(images);
    }

    return this.findOne(saved.id);
  }

  async findAll(query: {
    category?: number;
    search?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    const qb = this.listingsRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.images', 'images')
      .leftJoinAndSelect('listing.category', 'category')
      .leftJoin('listing.seller', 'seller')
      .addSelect(['seller.id', 'seller.firstName', 'seller.lastName', 'seller.averageRating', 'seller.profileImage'])
      .where('listing.status = :status', { status: 'active' })
      .orderBy('listing.createdAt', 'DESC');

    if (query.category) {
      qb.andWhere('listing.categoryId = :categoryId', {
        categoryId: query.category,
      });
    }

    if (query.search) {
      qb.andWhere(
        '(listing.title LIKE :search OR listing.description LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.type) {
      qb.andWhere('listing.listingType = :type', { type: query.type });
    }

    const page = Math.max(query.page || 1, 1);
    const limit = Math.min(Math.max(query.limit || DEFAULT_PAGE_LIMIT, 1), 100);
    qb.skip((page - 1) * limit).take(limit);

    const [listings, total] = await qb.getManyAndCount();

    return {
      data: listings.map((l) => ({
        ...l,
        seller: l.seller
          ? {
              id: l.seller.id,
              firstName: l.seller.firstName,
              lastName: l.seller.lastName,
              averageRating: l.seller.averageRating,
            }
          : null,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number, viewer?: ListingViewer) {
    const listing = await this.listingsRepository.findOne({
      where: { id },
      relations: ['images', 'category', 'seller', 'bids', 'bids.bidder'],
    });
    if (!listing) throw new NotFoundException('Listing not found');

    const canManageListing =
      viewer?.role === 'admin' || viewer?.id === listing.sellerId;

    if (
      (listing.status === 'hidden' || listing.status === 'deleted') &&
      !canManageListing
    ) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.status === 'active') {
      await this.listingsRepository.increment({ id }, 'viewsCount', 1);
      listing.viewsCount += 1;
    }

    return {
      ...listing,
      seller: {
        id: listing.seller.id,
        firstName: listing.seller.firstName,
        lastName: listing.seller.lastName,
        averageRating: listing.seller.averageRating,
        profileImage: listing.seller.profileImage,
      },
      bids: listing.bids
        ?.sort((a, b) => Number(b.amount) - Number(a.amount))
        .map((b) => {
          const canSeeBidderIdentity =
            canManageListing || viewer?.id === b.bidder.id;

          return {
            id: b.id,
            amount: b.amount,
            status: b.status,
            createdAt: b.createdAt,
            bidder: canSeeBidderIdentity
              ? {
                  id: b.bidder.id,
                  firstName: b.bidder.firstName,
                  lastName: b.bidder.lastName,
                }
              : {
                  id: 0,
                  firstName: 'Private',
                  lastName: 'Bidder',
                },
          };
        }),
    };
  }

  async update(id: number, userId: number, updateDto: UpdateListingDto) {
    const listing = await this.listingsRepository.findOne({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.sellerId !== userId) {
      throw new ForbiddenException('You can only edit your own listings');
    }
    if (listing.status !== 'active') {
      throw new ForbiddenException('Only active listings can be edited');
    }

    // Validate category if being changed
    if (updateDto.categoryId !== undefined) {
      const category = await this.categoriesRepository.findOne({
        where: { id: updateDto.categoryId },
      });
      if (!category) {
        throw new BadRequestException('Invalid category');
      }
    }

    // Only update fields that are explicitly provided (not undefined)
    const updateData: Record<string, any> = {};
    if (updateDto.title !== undefined) updateData.title = updateDto.title;
    if (updateDto.description !== undefined) updateData.description = updateDto.description;
    if (updateDto.price !== undefined) updateData.price = updateDto.price;
    if (updateDto.categoryId !== undefined) updateData.categoryId = updateDto.categoryId;
    if (updateDto.conditionStatus !== undefined) updateData.conditionStatus = updateDto.conditionStatus;

    if (Object.keys(updateData).length > 0) {
      await this.listingsRepository.update(id, updateData);
    }

    return this.findOne(id);
  }

  async remove(id: number, userId: number) {
    const listing = await this.listingsRepository.findOne({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.sellerId !== userId) {
      throw new ForbiddenException('You can only delete your own listings');
    }
    if (listing.status === 'deleted') {
      throw new BadRequestException('This listing is already deleted');
    }

    await this.listingsRepository.update(id, { status: 'deleted' });
    return { message: 'Listing deleted' };
  }

  async findByUser(userId: number) {
    return this.listingsRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.images', 'images')
      .leftJoinAndSelect('listing.category', 'category')
      .where('listing.sellerId = :userId', { userId })
      .andWhere('listing.status != :status', { status: 'deleted' })
      .orderBy('listing.createdAt', 'DESC')
      .getMany();
  }

  async getCategories() {
    return this.categoriesRepository.find({ order: { name: 'ASC' } });
  }
}
