class PortfolioViewer {
    constructor() {
        this.currentPage = 1;
        this.totalPages = 0;
        this.isLoading = false;
        this.pagesWrapper = document.getElementById('pagesWrapper');
        this.pageIndicator = document.querySelector('.page-indicator');
        this.prevBtn = document.querySelector('.nav-btn.prev');
        this.nextBtn = document.querySelector('.nav-btn.next');
        this.loadingScreen = document.querySelector('.loading-screen');
        this.progressBar = document.querySelector('.progress');
        this.loadedPages = new Set();
        
        this.init();
    }
    
    async init() {
        try {
            await this.detectTotalPages();
            await this.loadInitialPages();
            this.setupEventListeners();
            this.hideLoadingScreen();
        } catch (error) {
            console.error('Error:', error);
            this.showError();
        }
    }
    
    async detectTotalPages() {
        // Dinamik olarak toplam sayfa sayısını bul
        let pageNum = 1;
        let found = true;
        
        while (found && pageNum <= 200) { // Max 200 sayfa kontrol et
            try {
                const response = await fetch(`assets/images/page-${pageNum}.png`, { method: 'HEAD' });
                if (response.ok) {
                    pageNum++;
                } else {
                    found = false;
                }
            } catch {
                found = false;
            }
        }
        
        this.totalPages = pageNum - 1;
        console.log(`Total pages detected: ${this.totalPages}`);
        this.pageIndicator.textContent = `1 / ${this.totalPages}`;
    }
    
    async loadInitialPages() {
        // İlk 3 sayfayı yükle
        for (let i = 1; i <= Math.min(3, this.totalPages); i++) {
            await this.loadPage(i);
        }
    }
    
    async loadPage(pageNum) {
        if (this.loadedPages.has(pageNum)) return;
        
        const imageSrc = `assets/images/page-${pageNum}.png`;
        try {
            await this.loadImage(imageSrc, pageNum);
            this.loadedPages.add(pageNum);
            
            // Progress bar
            const progress = (pageNum / Math.min(3, this.totalPages)) * 100;
            this.progressBar.style.width = `${progress}%`;
        } catch (error) {
            console.error(`Failed to load page ${pageNum}:`, error);
        }
    }
    
    loadImage(src, pageNum) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.createPageElement(src, pageNum);
                resolve();
            };
            img.onerror = reject;
            img.src = src;
        });
    }
    
    createPageElement(src, pageNum) {
        const pageDiv = document.createElement('div');
        pageDiv.className = `page ${pageNum === 1 ? 'active' : ''}`;
        pageDiv.dataset.page = pageNum;
        
        const img = document.createElement('img');
        img.src = src;
        img.className = 'page-image';
        img.loading = 'lazy'; // Lazy loading ekle
        
        pageDiv.appendChild(img);
        this.pagesWrapper.appendChild(pageDiv);
    }
    
    hideLoadingScreen() {
        gsap.to(this.loadingScreen, {
            opacity: 0,
            duration: 0.8,
            onComplete: () => {
                this.loadingScreen.style.display = 'none';
            }
        });
    }
    
    setupEventListeners() {
        this.prevBtn.addEventListener('click', () => this.goToPrevPage());
        this.nextBtn.addEventListener('click', () => this.goToNextPage());
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.goToPrevPage();
            if (e.key === 'ArrowRight') this.goToNextPage();
        });
        
        // Touch swipe
        let touchStartX = 0;
        
        this.pagesWrapper.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        this.pagesWrapper.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            
            if (Math.abs(diff) > 50) {
                if (diff > 0) this.goToNextPage();
                else this.goToPrevPage();
            }
        });
    }
    
    async goToPrevPage() {
        if (this.currentPage > 1 && !this.isLoading) {
            this.isLoading = true;
            this.currentPage--;
            
            // Önceki ve sonraki sayfaları önceden yükle
            this.preloadNearbyPages();
            this.transitionToPage();
        }
    }
    
    async goToNextPage() {
        if (this.currentPage < this.totalPages && !this.isLoading) {
            this.isLoading = true;
            this.currentPage++;
            
            // Önceki ve sonraki sayfaları önceden yükle
            this.preloadNearbyPages();
            this.transitionToPage();
        }
    }
    
    async preloadNearbyPages() {
        const pagesToPreload = [
            this.currentPage - 1,
            this.currentPage,
            this.currentPage + 1
        ].filter(p => p > 0 && p <= this.totalPages);
        
        for (const pageNum of pagesToPreload) {
            if (!this.loadedPages.has(pageNum)) {
                this.loadPage(pageNum);
            }
        }
    }
    
    transitionToPage() {
        const translateX = -(this.currentPage - 1) * 100;
        
        gsap.to(this.pagesWrapper, {
            x: `${translateX}vw`,
            duration: 0.6,
            ease: "power2.inOut",
            onComplete: () => {
                this.isLoading = false;
            }
        });
        
        // Update active states
        document.querySelectorAll('.page').forEach((page) => {
            const pageNum = parseInt(page.dataset.page);
            if (pageNum === this.currentPage) {
                page.classList.add('active');
            } else {
                page.classList.remove('active');
            }
        });
        
        // Update navigation
        this.pageIndicator.textContent = `${this.currentPage} / ${this.totalPages}`;
        this.prevBtn.disabled = this.currentPage === 1;
        this.nextBtn.disabled = this.currentPage === this.totalPages;
    }
    
    showError() {
        this.loadingScreen.innerHTML = `
            <div class="loader">
                <div class="loader-text">Yükleme hatası</div>
                <div style="font-size: 14px; margin-top: 10px;">
                    Lütfen sayfayı yenileyin
                </div>
            </div>
        `;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new PortfolioViewer();
});
