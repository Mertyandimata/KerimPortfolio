// PDF.js configuration
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

class PortfolioViewer {
    constructor() {
        this.pdfDoc = null;
        this.currentPage = 1;
        this.totalPages = 0;
        this.isLoading = false;
        this.pagesWrapper = document.querySelector('.pages-wrapper');
        this.pageIndicator = document.querySelector('.page-indicator');
        this.prevBtn = document.querySelector('.nav-btn.prev');
        this.nextBtn = document.querySelector('.nav-btn.next');
        this.loadingScreen = document.querySelector('.loading-screen');
        this.progressBar = document.querySelector('.progress');
        this.touchStartX = 0;
        this.touchEndX = 0;
        
        this.init();
    }
    
    async init() {
        try {
            await this.loadPDF();
            this.setupEventListeners();
            this.initAnimations();
        } catch (error) {
            console.error('Error initializing portfolio:', error);
            // Hata durumunda loading ekranını kaldır ve hata göster
            this.loadingScreen.innerHTML = `
                <div class="loader">
                    <div class="loader-text">Hata: PDF yüklenemedi</div>
                    <div style="font-size: 14px; margin-top: 10px;">${error.message}</div>
                </div>
            `;
        }
    }
    
    async loadPDF() {
        try {
            // GitHub Pages için doğru URL'yi kullanalım
            const pdfUrl = window.location.hostname === 'localhost' 
                ? 'assets/pdf/portfolio.pdf'
                : 'https://mertyandimata.github.io/KerimPortfolio/assets/pdf/portfolio.pdf';
                
            console.log('PDF URL:', pdfUrl);
            
            const loadingTask = pdfjsLib.getDocument(pdfUrl);
            
            loadingTask.onProgress = (progress) => {
                const percent = (progress.loaded / progress.total) * 100;
                this.progressBar.style.width = percent + '%';
                console.log(`Loading: ${percent.toFixed(0)}%`);
            };
            
            this.pdfDoc = await loadingTask.promise;
            this.totalPages = this.pdfDoc.numPages;
            this.pageIndicator.textContent = `1 / ${this.totalPages}`;
            
            // Load all pages for smooth transitions
            await this.loadAllPages();
            
            // Hide loading screen
            this.loadingScreen.style.opacity = '0';
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
            }, 800);
            
        } catch (error) {
            console.error('Error loading PDF:', error);
            throw error;
        }
    }
    
    async loadAllPages() {
        for (let pageNum = 1; pageNum <= this.totalPages; pageNum++) {
            console.log(`Loading page ${pageNum} of ${this.totalPages}`);
            const page = await this.pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2.0 });
            
            const pageDiv = document.createElement('div');
            pageDiv.className = `page ${pageNum === 1 ? 'active' : ''}`;
            pageDiv.dataset.page = pageNum;
            
            const canvas = document.createElement('canvas');
            canvas.className = 'page-canvas';
            const context = canvas.getContext('2d');
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            pageDiv.appendChild(canvas);
            this.pagesWrapper.appendChild(pageDiv);
            
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
        }
    }
    
    setupEventListeners() {
        this.prevBtn.addEventListener('click', () => this.goToPrevPage());
        this.nextBtn.addEventListener('click', () => this.goToNextPage());
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.goToPrevPage();
            if (e.key === 'ArrowRight') this.goToNextPage();
        });
        
        // Touch events for swipe
        this.pagesWrapper.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
        });
        
        this.pagesWrapper.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        });
    }
    
    handleSwipe() {
        const swipeThreshold = 50;
        const diff = this.touchStartX - this.touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                this.goToNextPage();
            } else {
                this.goToPrevPage();
            }
        }
    }
    
    goToPrevPage() {
        if (this.currentPage > 1 && !this.isLoading) {
            this.isLoading = true;
            this.currentPage--;
            this.transitionToPage();
        }
    }
    
    goToNextPage() {
        if (this.currentPage < this.totalPages && !this.isLoading) {
            this.isLoading = true;
            this.currentPage++;
            this.transitionToPage();
        }
    }
    
    transitionToPage() {
        const pages = document.querySelectorAll('.page');
        
        // Update wrapper position
        const translateX = -(this.currentPage - 1) * 100;
        this.pagesWrapper.style.transform = `translateX(${translateX}vw)`;
        
        // Update active states
        pages.forEach((page, index) => {
            if (index + 1 === this.currentPage) {
                page.classList.add('active');
            } else {
                page.classList.remove('active');
            }
        });
        
        // Update navigation
        this.pageIndicator.textContent = `${this.currentPage} / ${this.totalPages}`;
        this.prevBtn.disabled = this.currentPage === 1;
        this.nextBtn.disabled = this.currentPage === this.totalPages;
        
        setTimeout(() => {
            this.isLoading = false;
        }, 800);
    }
    
    initAnimations() {
        // GSAP animations for smooth transitions
        gsap.registerPlugin(ScrollTrigger);
        
        // Add subtle animations to pages as they appear
        const pages = document.querySelectorAll('.page');
        pages.forEach((page, index) => {
            gsap.from(page, {
                opacity: 0,
                scale: 0.8,
                duration: 1,
                delay: index * 0.1,
                ease: "power2.out"
            });
        });
    }
}

// Initialize the portfolio viewer
document.addEventListener('DOMContentLoaded', () => {
    new PortfolioViewer();
});
