import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ListingsService } from '../../services/listings.service';
import { Category, Listing } from '@campusexchange/shared';

@Component({
  selector: 'app-edit-listing',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="create-page">
      <div class="form-card">
        @if (pageLoading) {
          <p class="loading-text">Loading listing...</p>
        } @else if (listing) {
          <h2>Edit Listing</h2>
          <p class="subtitle">Update your listing details</p>

          @if (error) {
            <div class="error">{{ error }}</div>
          }
          @if (success) {
            <div class="success">{{ success }}</div>
          }

          <form (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label>Title</label>
              <input type="text" [(ngModel)]="title" name="title" required />
            </div>

            <div class="form-group">
              <label>Description</label>
              <textarea [(ngModel)]="description" name="description" required></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Price ($)</label>
                <input type="number" [(ngModel)]="price" name="price" min="0" step="0.01" required />
              </div>
              <div class="form-group">
                <label>Category</label>
                <select [(ngModel)]="categoryId" name="categoryId" required>
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
                <select [(ngModel)]="listingType" name="listingType" disabled>
                  <option value="fixed">Fixed Price</option>
                  <option value="bidding">Accept Bids</option>
                </select>
                <small class="field-hint">Listing type cannot be changed</small>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn-secondary" (click)="cancel()">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="saving">
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        } @else {
          <div class="error">Listing not found or you don't have permission to edit it.</div>
        }
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
    .form-group select:disabled { background: #f0f0f0; color: #999; }
    textarea { min-height: 100px; resize: vertical; font-family: inherit; }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
      border-color: #003366;
    }
    .form-actions { display: flex; gap: 1rem; margin-top: 0.5rem; }
    .btn-primary {
      flex: 1;
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
    .btn-secondary {
      flex: 1;
      padding: 14px;
      background: white;
      color: #333;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
    }
    .error {
      background: #fee;
      color: #c00;
      padding: 10px;
      border-radius: 6px;
      margin-bottom: 1rem;
    }
    .success {
      background: #efe;
      color: #060;
      padding: 10px;
      border-radius: 6px;
      margin-bottom: 1rem;
    }
    .loading-text { text-align: center; color: #999; padding: 2rem; }
    .field-hint { color: #999; font-size: 0.8rem; margin-top: 4px; display: block; }
  `]
})
export class EditListingComponent implements OnInit {
  listing?: Listing;
  categories: Category[] = [];
  title = '';
  description = '';
  price?: number;
  categoryId?: number;
  conditionStatus: 'new' | 'like_new' | 'good' | 'fair' | 'poor' = 'good';
  listingType: 'fixed' | 'bidding' = 'fixed';
  pageLoading = true;
  saving = false;
  error = '';
  success = '';
  private listingId!: number;

  constructor(
    private route: ActivatedRoute,
    private listingsService: ListingsService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.listingId = Number(this.route.snapshot.paramMap.get('id'));
    if (isNaN(this.listingId)) {
      this.pageLoading = false;
      return;
    }

    this.listingsService.getCategories().subscribe((cats) => (this.categories = cats));

    this.listingsService.getListing(this.listingId).subscribe({
      next: (listing) => {
        this.listing = listing;
        this.title = listing.title;
        this.description = listing.description;
        this.price = Number(listing.price);
        this.categoryId = listing.category.id;
        this.conditionStatus = listing.conditionStatus as typeof this.conditionStatus;
        this.listingType = listing.listingType as typeof this.listingType;
        this.pageLoading = false;
      },
      error: () => {
        this.pageLoading = false;
      },
    });
  }

  onSubmit() {
    this.error = '';
    this.success = '';

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

    this.saving = true;

    this.listingsService.updateListing(this.listingId, {
      title: this.title.trim(),
      description: this.description.trim(),
      price: this.price,
      categoryId: this.categoryId,
      conditionStatus: this.conditionStatus,
    }).subscribe({
      next: () => {
        this.success = 'Listing updated successfully!';
        this.saving = false;
        setTimeout(() => this.router.navigate(['/listing', this.listingId]), 1000);
      },
      error: (err) => {
        this.error = err.error?.message?.[0] || err.error?.message || 'Failed to update listing';
        this.saving = false;
      },
    });
  }

  cancel() {
    this.router.navigate(['/listing', this.listingId]);
  }
}
