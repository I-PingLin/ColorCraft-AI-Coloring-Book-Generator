
import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from './services/ai.service';
import { ChatBotComponent } from './components/chat-bot.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, ChatBotComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  private aiService = inject(AiService);

  childName = signal('');
  theme = signal('');
  resolution = signal('1K');
  
  isGenerating = signal(false);
  progress = signal(0);
  statusMessage = signal('');
  
  generatedImages = signal<string[]>([]);
  coverImage = signal<string | null>(null);

  isFormValid = computed(() => this.childName().trim().length > 0 && this.theme().trim().length > 0);

  async generateBook() {
    if (!this.isFormValid() || this.isGenerating()) return;

    this.isGenerating.set(true);
    this.progress.set(5);
    this.statusMessage.set('Thinking of amazing scenes...');
    this.generatedImages.set([]);
    this.coverImage.set(null);

    try {
      // 1. Generate scene prompts
      const prompts = await this.aiService.generatePrompts(this.theme(), this.childName());
      this.progress.set(15);
      this.statusMessage.set(`Designing a special cover for ${this.childName()}...`);

      // 2. Generate Cover
      const coverPrompt = `Cover for ${this.childName()}'s coloring book about ${this.theme()}`;
      const cover = await this.aiService.generateImage(coverPrompt, true, this.resolution());
      this.coverImage.set(cover);
      this.progress.set(30);

      // 3. Generate 5 Pages
      const pages: string[] = [];
      for (let i = 0; i < prompts.length; i++) {
        this.statusMessage.set(`Creating page ${i + 1} of 5: ${prompts[i]}...`);
        const img = await this.aiService.generateImage(prompts[i], false, this.resolution());
        pages.push(img);
        this.generatedImages.set([...pages]);
        this.progress.set(30 + ((i + 1) * 14));
      }

      this.progress.set(100);
      this.statusMessage.set('Done! Your coloring book is ready.');
    } catch (error) {
      console.error(error);
      this.statusMessage.set('Oops, something went wrong. Please try again.');
    } finally {
      this.isGenerating.set(false);
    }
  }

  async downloadPdf() {
    const { jsPDF } = (window as any).jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    // Cover Page
    if (this.coverImage()) {
      doc.addImage(this.coverImage()!, 'PNG', 10, 20, width - 20, width - 20);
      doc.setFontSize(40);
      doc.setTextColor(63, 81, 181);
      doc.text(`${this.childName()}'s`, width / 2, height - 60, { align: 'center' });
      doc.text(`Adventure`, width / 2, height - 40, { align: 'center' });
    }

    // Interior Pages
    for (const img of this.generatedImages()) {
      doc.addPage();
      doc.addImage(img, 'PNG', 10, 10, width - 20, width - 20);
      doc.setFontSize(12);
      doc.setTextColor(150, 150, 150);
      doc.text(`Coloring fun for ${this.childName()}`, width / 2, height - 15, { align: 'center' });
    }

    doc.save(`${this.childName()}_coloring_book.pdf`);
  }
}
