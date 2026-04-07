import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ListingsService } from '../../services/listings.service';
import { Category, CreateListingRequest } from '@campusexchange/shared';

@Component({
  selector: 'app-create-listing',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="create-page">
      <div class="form-card">
        <h2>Create a Listing</h2>
        <p class="subtitle">Sell or rent your items to fellow FAU students</p>

        @if (error) {
          <div class="error">{{ error }}</div>
        }

        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label>Title</label>
            <input type="text" [(ngModel)]="title" name="title" placeholder="e.g. Calculus Textbook 10th Edition" required />
          </div>

          <div class="form-group">
            <label>Description</label>
            <textarea [(ngModel)]="description" name="description" placeholder="Describe your item..." required></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Price ($)</label>
              <input type="number" [(ngModel)]="price" name="price" min="0" step="0.01" required />
            </div>
            <div class="form-group">
              <label>Category</label>
              <select [(ngModel)]="categoryId" name="categoryId" required>
                <option [ngValue]="undefined" disabled>Select category</option>
                @for (cat of categories; track cat.id) {
                  <option [ngValue]="cat.id">{{ cat.name }}</option>
                }
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Condition</label>
              <select [(ngModel)]="conditionStatus" name="conditionStatus">
                <option value="new">New</option>
                <option value="like_new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
            <div class="form-group">
              <label>Listing Type</label>
              <select [(ngModel)]="listingType" name="listingType">
                <option value="fixed">Fixed Price</option>
                <option value="bidding">Accept Bids</option>
              </select>
            </div>
          </div>

          @if (listingType === 'bidding') {
            <div class="form-group">
              <label>Bidding End Date</label>
              <input type="datetime-local" [(ngModel)]="bidEndDate" name="bidEndDate" />
            </div>
          }

          <div class="form-group">
            <label>Image URL (optional)</label>
            <input type="text" [(ngModel)]="imageUrl" name="imageUrl" placeholder="https://example.com/image.jpg" />
          </div>

          <button type="submit" class="btn-primary" [disabled]="loading">
            {{ loading ? 'Creating...' : 'Post Listing' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .create-page {
      min-height: calc(100vh - 64px);
      background: #f8f9fa;
      padding: 2rem;
      display: flex;
      justify-content: center;
    }
    .form-card {
      background: white;
      padding: 2.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      width: 100%;
      max-width: 600px;
    }
    h2 { margin: 0 0 0.5rem; }
    .subtitle { color: #666; margin-bottom: 1.5rem; }
    .form-row { display: flex; gap: 1rem; }
    .form-group { margin-bottom: 1rem; flex: 1; }
    .form-group label {
      display: block;
      margin-bottom: 0.3rem;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .form-group input, .form-group select, .form-group textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 1rem;
      outline: none;
      box-sizing: border-box;
    }
    textarea { min-height: 100px; resize: vertical; font-family: inherit; }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
      border-color: #003366;
    }
    .btn-primary {
      width: 100%;
      padding: 14px;
      background: #CC0000;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-primary:disabled { opacity: 0.6; }
    .error {
      background: #fee;
      color: #c00;
      padding: 10px;
      border-radius: 6px;
      margin-bottom: 1rem;
    }
  `]
})
export class CreateListingComponent implements OnInit {
  categories: Category[] = [];
  title = '';
  description = '';
  price?: number;
  categoryId?: number;
  conditionStatus: 'new' | 'like_new' | 'good' | 'fair' | 'poor' = 'good';
  listingType: 'fixed' | 'bidding' = 'fixed';
  bidEndDate = '';
  imageUrl = '';
  loading = false;
  error = '';

  constructor(
    private listingsService: ListingsService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.listingsService.getCategories().subscribe((cats) => (this.categories = cats));
  }

  onSubmit() {
    this.error = '';

    if (!this.title.trim() || !this.description.trim()) {
      this.error = 'Title and description are required.';
      return;
    }
    if (!this.price || this.price <= 0) {
      this.error = 'Please enter a valid price.';
      return;
    }
    if (!this.categoryId) {
      this.error = 'Please select a category.';
      return;
    }
    if (this.listingType === 'bidding' && this.bidEndDate && new Date(this.bidEndDate) <= new Date()) {
      this.error = 'Bidding end date must be in the future.';
      return;
    }

    this.loading = true;

    const data: CreateListingRequest = {
      title: this.title.trim(),
      description: this.description.trim(),
      price: this.price,
      categoryId: this.categoryId,
      conditionStatus: this.conditionStatus,
      listingType: this.listingType,
      bidEndDate: this.listingType === 'bidding' && this.bidEndDate ? this.bidEndDate : undefined,
      imageUrls: this.imageUrl ? [this.imageUrl] : undefined,
    };

    this.listingsService.createListing(data).subscribe({
      next: (listing) => {
        this.router.navigate(['/listing', listing.id]);
      },
      error: (err) => {
        this.error = err.error?.message?.[0] || err.error?.message || 'Failed to create listing';
        this.loading = false;
      },
    });
  }
}
