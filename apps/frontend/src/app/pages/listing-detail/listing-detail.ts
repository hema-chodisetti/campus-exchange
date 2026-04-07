import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { ListingsService } from '../../services/listings.service';
import { BidsService } from '../../services/bids.service';
import { MessagesService } from '../../services/messages.service';
import { AuthService } from '../../services/auth.service';
import { Listing } from '@campusexchange/shared';

@Component({
  selector: 'app-listing-detail',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DatePipe, TitleCasePipe, RouterLink],
  template: `
    @if (loading) {
      <div class="detail-page">
        <div class="loading-container">Loading listing...</div>
      </div>
    } @else if (listing) {
      <div class="detail-page">
        <div class="detail-container">
          <div class="images-section">
            @if (listing.images && listing.images.length > 0 && !imageFailed) {
              <img [src]="listing.images[0].imageUrl" [alt]="listing.title" class="main-image" (error)="imageFailed = true" />
            } @else {
              <div class="placeholder-image">📦</div>
            }
          </div>

          <div class="info-section">
            <div class="listing-header">
              <h1>{{ listing.title }}</h1>
              <p class="price">{{ listing.price | currency }}</p>
            </div>

            <div class="meta-tags">
              <span class="tag">{{ listing.conditionStatus | titlecase }}</span>
              <span class="tag">{{ listing.category.name }}</span>
              @if (listing.listingType === 'bidding') {
                <span class="tag bid-tag">Accepting Bids</span>
              }
            </div>

            <div class="description">
              <h3>Description</h3>
              <p>{{ listing.description }}</p>
            </div>

            <div class="seller-info">
              <h3>Seller</h3>
              <div class="seller-card">
                <div class="seller-avatar">{{ (listing.seller.firstName || '?')[0] }}{{ (listing.seller.lastName || '?')[0] }}</div>
                <div>
                  <p class="seller-name">{{ listing.seller.firstName }} {{ listing.seller.lastName }}</p>
                  <p class="seller-rating">Rating: {{ listing.seller.averageRating }}/5</p>
                </div>
              </div>
            </div>

            @if (isOwner()) {
              <div class="owner-actions">
                <a [routerLink]="['/edit-listing', listing.id]" class="btn-edit">Edit Listing</a>
                <button class="btn-delete" (click)="deleteListing()" [disabled]="deleting">
                  {{ deleting ? 'Deleting...' : 'Delete Listing' }}
                </button>
              </div>
            }

            @if (listing.listingType === 'bidding' && !isBiddingExpired()) {
              <div class="bidding-section">
                <h3>Place a Bid</h3>
                @if (listing.bids && listing.bids.length > 0) {
                  <p class="current-bid">Current highest bid: {{ listing.bids[0].amount | currency }}</p>
                }
                @if (auth.isLoggedIn && listing.seller.id !== auth.currentUser?.id) {
                  <p class="bid-hint">Minimum bid: {{ getMinBidAmount() | currency }}</p>
                  <div class="bid-form">
                    <input type="number" [(ngModel)]="bidAmount" [placeholder]="'Min: ' + getMinBidAmount().toFixed(2)" [min]="getMinBidAmount()" step="0.01" />
                    <button (click)="placeBid()" [disabled]="bidding">{{ bidding ? 'Placing...' : 'Place Bid' }}</button>
                  </div>
                }
              </div>
            } @else if (listing.listingType === 'bidding' && isBiddingExpired()) {
              <div class="bidding-section">
                <h3>Auction Ended</h3>
                @if (listing.bids && listing.bids.length > 0) {
                  <p class="current-bid">Winning bid: {{ listing.bids[0].amount | currency }}</p>
                }
              </div>
            }

            @if (auth.isLoggedIn && listing.seller.id !== auth.currentUser?.id) {
              <div class="message-section">
                <h3>Contact Seller</h3>
                <textarea [(ngModel)]="messageContent" placeholder="Hi, is this still available?"></textarea>
                <button (click)="sendMessage()" class="btn-message" [disabled]="sending">{{ sending ? 'Sending...' : 'Send Message' }}</button>
              </div>
            }

            @if (errorMsg) {
              <div class="error">{{ errorMsg }}</div>
            }
            @if (successMsg) {
              <div class="success">{{ successMsg }}</div>
            }

            <div class="listing-meta">
              <p>Posted {{ listing.createdAt | date:'mediumDate' }}</p>
              <p>{{ listing.viewsCount }} views</p>
            </div>
          </div>
        </div>
      </div>
    } @else if (errorMsg) {
      <div class="detail-page">
        <div class="error-container">{{ errorMsg }}</div>
      </div>
    }
  `,
  styles: [`
    .detail-page { background: #f8f9fa; min-height: calc(100vh - 64px); padding: 2rem; }
    .detail-container {
      max-width: 1000px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.08);
    }
    .loading-container, .error-container {
      max-width: 600px;
      margin: 2rem auto;
      text-align: center;
      padding: 2rem;
      background: white;
      border-radius: 12px;
    }
    .error-container { color: #c00; }
    .images-section { background: #f0f0f0; min-height: 400px; }
    .main-image { width: 100%; height: 100%; object-fit: cover; }
    .placeholder-image {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 5rem;
    }
    .info-section { padding: 2rem; }
    h1 { margin: 0 0 0.5rem; font-size: 1.8rem; }
    .price { font-size: 1.8rem; font-weight: 700; color: #CC0000; margin: 0 0 1rem; }
    .meta-tags { display: flex; gap: 8px; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .tag {
      padding: 4px 12px;
      background: #f0f0f0;
      border-radius: 20px;
      font-size: 0.85rem;
    }
    .bid-tag { background: #CC0000; color: white; }
    .description { margin-bottom: 1.5rem; }
    .description h3 { margin: 0 0 0.5rem; }
    .description p { color: #555; line-height: 1.6; }
    .seller-info { margin-bottom: 1.5rem; }
    .seller-card { display: flex; align-items: center; gap: 12px; }
    .seller-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #003366;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
    }
    .seller-name { font-weight: 600; margin: 0; }
    .seller-rating { color: #888; margin: 0; font-size: 0.9rem; }
    .bidding-section, .message-section { margin-bottom: 1.5rem; }
    .bid-form { display: flex; gap: 8px; }
    .bid-form input {
      flex: 1;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 1rem;
    }
    .bid-form button, .btn-message {
      padding: 10px 20px;
      background: #CC0000;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
    }
    .bid-form button:disabled, .btn-message:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .current-bid { color: #CC0000; font-weight: 600; }
    .bid-hint { color: #666; font-size: 0.85rem; margin-bottom: 0.5rem; }
    textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      min-height: 80px;
      font-size: 1rem;
      resize: vertical;
      box-sizing: border-box;
      margin-bottom: 8px;
    }
    .success {
      background: #efe;
      color: #060;
      padding: 10px;
      border-radius: 6px;
      margin-top: 1rem;
    }
    .error {
      background: #fee;
      color: #c00;
      padding: 10px;
      border-radius: 6px;
      margin-top: 1rem;
    }
    .owner-actions {
      display: flex;
      gap: 10px;
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }
    .btn-edit {
      flex: 1;
      padding: 10px 20px;
      background: #003366;
      color: white;
      border: none;
      border-radius: 6px;
      text-align: center;
      text-decoration: none;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-delete {
      flex: 1;
      padding: 10px 20px;
      background: white;
      color: #CC0000;
      border: 2px solid #CC0000;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-delete:hover { background: #CC0000; color: white; }
    .btn-delete:disabled { opacity: 0.6; cursor: not-allowed; }
    .listing-meta { margin-top: 1.5rem; color: #999; font-size: 0.85rem; }
    .listing-meta p { margin: 2px 0; }
    @media (max-width: 768px) {
      .detail-container { grid-template-columns: 1fr; }
    }
  `]
})
export class ListingDetailComponent implements OnInit, OnDestroy {
  listing?: Listing;
  imageFailed = false;
  bidAmount?: number;
  messageContent = '';
  successMsg = '';
  errorMsg = '';
  loading = true;
  bidding = false;
  sending = false;
  deleting = false;
  private routeSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private listingsService: ListingsService,
    private bidsService: BidsService,
    private messagesService: MessagesService,
    public auth: AuthService,
  ) {}

  ngOnInit() {
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (isNaN(id)) {
        this.loading = false;
        this.errorMsg = 'Invalid listing ID';
        return;
      }
      this.loadListing(id);
    });
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
  }

  loadListing(id: number) {
    this.loading = true;
    this.errorMsg = '';
    this.imageFailed = false;
    this.listingsService.getListing(id).subscribe({
      next: (listing) => {
        this.listing = listing;
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Listing not found';
        this.loading = false;
      },
    });
  }

  isOwner(): boolean {
    return !!this.listing && this.auth.isLoggedIn && this.listing.seller.id === this.auth.currentUser?.id;
  }

  deleteListing() {
    if (!this.listing || !confirm(`Are you sure you want to delete "${this.listing.title}"?`)) return;
    this.deleting = true;
    this.listingsService.deleteListing(this.listing.id).subscribe({
      next: () => {
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Failed to delete listing';
        this.deleting = false;
      },
    });
  }

  getMinBidAmount(): number {
    if (this.listing?.bids && this.listing.bids.length > 0) {
      return Number(this.listing.bids[0].amount) + 0.01;
    }
    return Number(this.listing?.price || 0) + 0.01;
  }

  isBiddingExpired(): boolean {
    if (!this.listing?.bidEndDate) return false;
    return new Date(this.listing.bidEndDate) < new Date();
  }

  placeBid() {
    if (!this.listing || this.bidAmount === undefined || this.bidAmount === null || this.bidAmount <= 0) {
      this.errorMsg = 'Please enter a valid bid amount';
      return;
    }
    this.errorMsg = '';
    this.successMsg = '';
    this.bidding = true;
    this.bidsService.placeBid(this.listing.id, this.bidAmount).subscribe({
      next: () => {
        this.successMsg = 'Bid placed successfully!';
        this.bidding = false;
        this.loadListing(this.listing!.id);
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Failed to place bid';
        this.bidding = false;
      },
    });
  }

  sendMessage() {
    if (!this.listing || !this.messageContent?.trim()) {
      this.errorMsg = 'Please enter a message';
      return;
    }
    this.errorMsg = '';
    this.successMsg = '';
    this.sending = true;
    this.messagesService
      .sendMessage({
        listingId: this.listing.id,
        receiverId: this.listing.seller.id,
        content: this.messageContent.trim(),
      })
      .subscribe({
        next: () => {
          this.successMsg = 'Message sent!';
          this.messageContent = '';
          this.sending = false;
        },
        error: () => {
          this.errorMsg = 'Failed to send message';
          this.sending = false;
        },
      });
  }
}
