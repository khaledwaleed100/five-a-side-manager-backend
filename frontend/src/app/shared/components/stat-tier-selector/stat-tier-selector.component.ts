import { Component, Input, Output, EventEmitter, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type StatTier = 'low' | 'mid' | 'high' | 'custom';

const TIER_VALUES: Record<string, number> = {
  low: 30,
  mid: 60,
  high: 85,
};

@Component({
  selector: 'app-stat-tier-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mb-2">
      <div class="flex justify-between items-center mb-1.5">
        <label class="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
          {{ label }}
        </label>
        <div class="flex items-center gap-1.5">
          <span class="text-xs font-black"
                [class.text-red-500]="activeTier() === 'low'"
                [class.text-yellow-500]="activeTier() === 'mid'"
                [class.text-green-500]="activeTier() === 'high'"
                [class.text-blue-500]="activeTier() === 'custom'">
            {{ value }}
          </span>
          <button type="button"
                  (click)="toggleCustom()"
                  class="w-5 h-5 rounded-md flex items-center justify-center transition-colors"
                  [class.bg-blue-100]="showCustom()"
                  [class.text-blue-600]="showCustom()"
                  [class.bg-gray-100]="!showCustom()"
                  [class.dark:bg-gray-700]="!showCustom()"
                  [class.text-gray-400]="!showCustom()"
                  title="Fine-tune">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Tier pill buttons -->
      <div class="flex gap-1.5">
        <button type="button"
                class="tier-btn tier-low"
                [class.active]="activeTier() === 'low'"
                (click)="selectTier('low')">
          🔴 Low
        </button>
        <button type="button"
                class="tier-btn tier-mid"
                [class.active]="activeTier() === 'mid'"
                (click)="selectTier('mid')">
          🟡 Mid
        </button>
        <button type="button"
                class="tier-btn tier-high"
                [class.active]="activeTier() === 'high'"
                (click)="selectTier('high')">
          🟢 High
        </button>
      </div>

      <!-- Fine-tune number input (animated slide) -->
      <div *ngIf="showCustom()"
           class="mt-2 animate-slide-down">
        <input type="number"
               [ngModel]="value"
               (ngModelChange)="onCustomChange($event)"
               min="1" max="99"
               class="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-center font-bold">
      </div>
    </div>
  `,
})
export class StatTierSelectorComponent implements OnInit {
  @Input() label = '';
  @Input() value = 60;
  @Output() valueChange = new EventEmitter<number>();

  activeTier = signal<StatTier>('mid');
  showCustom = signal(false);

  ngOnInit() {
    this.activeTier.set(this.detectTier(this.value));
  }

  selectTier(tier: 'low' | 'mid' | 'high') {
    this.activeTier.set(tier);
    this.showCustom.set(false);
    const newVal = TIER_VALUES[tier];
    this.valueChange.emit(newVal);
  }

  toggleCustom() {
    this.showCustom.update(v => !v);
    if (this.showCustom()) {
      this.activeTier.set('custom');
    }
  }

  onCustomChange(val: number) {
    const clamped = Math.max(1, Math.min(99, Number(val) || 1));
    this.activeTier.set('custom');
    this.valueChange.emit(clamped);
  }

  private detectTier(val: number): StatTier {
    if (val <= 40) return 'low';
    if (val <= 72) return 'mid';
    if (val >= 73) return 'high';
    return 'mid';
  }
}
