class PortfolioViewer {
    constructor() {
        this.currentPage = 1;
        this.totalPages = 65;
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
            this.pageIndicator.textContent = `1 / ${this.totalPages}`;
            await this.loadInitialPages();
            this.setupEventListeners();
            this.hideLoadingScreen();
        } catch (error) {
            console.error('Init error:', error);
            this.showError();
        }
    }
    
    async loadInitialPages() {
        // İlk 5 sayfayı yükle
        for (let i = 1; i <= Math.min(5, this.totalPages); i++) {
            await this.loadPage(i);
        }
    }
    
    async loadPage(pageNum) {
        if (this.loadedPages.has(pageNum)) return;
        
        // Dosya isimleri page-01, page-02 formatında
        const paddedNum = String(pageNum).padStart(2, '0');
        const imageSrc = `assets/images/page-${paddedNum}.png`;
        
        try {
            await this.loadImage(imageSrc, pageNum);
            this.loadedPages.add(pageNum);
            
            const progress = (this.loadedPages.size / Math.min(5, this.totalPages)) * 100;
            this.progressBar.style.width = `${progress}%`;
        } catch (error) {
            console.error(`Failed to load page ${pageNum}:`, error);
        }
    }
    
    loadImage(src, pageNum) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                this.createPageElement(img.src, pageNum);
                resolve();
            };
            
            img.onerror = reject;
            img.src = src;
        });
    }
    
    createPageElement(src, pageNum) {
        if (document.querySelector(`.page[data-page="${pageNum}"]`)) return;
        
        const pageDiv = document.createElement('div');
        pageDiv.className = `page ${pageNum === 1 ? 'active' : ''}`;
        pageDiv.dataset.page = pageNum;
        
        const img = document.createElement('img');
        img.src = src;
        img.className = 'page-image';
        img.loading = 'lazy';
        
        pageDiv.appendChild(img);
        
        // Sayfaları sıralı ekle
        const pages = Array.from(this.pagesWrapper.children);
        const insertIndex = pages.findIndex(p => parseInt(p.dataset.page) > pageNum);
        
        if (insertIndex === -1) {
            this.pagesWrapper.appendChild(pageDiv);
        } else {
            this.pagesWrapper.insertBefore(pageDiv, pages[insertIndex]);
        }
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
            
            await this.ensurePageLoaded(this.currentPage);
            await this.preloadNearbyPages();
            this.transitionToPage();
        }
    }
    
    async goToNextPage() {
        if (this.currentPage < this.totalPages && !this.isLoading) {
            this.isLoading = true;
            this.currentPage++;
            
            await this.ensurePageLoaded(this.currentPage);
            await this.preloadNearbyPages();
            this.transitionToPage();
        }
    }
    
    async ensurePageLoaded(pageNum) {
        if (!this.loadedPages.has(pageNum)) {
            await this.loadPage(pageNum);
        }
    }
    
    async preloadNearbyPages() {
        const buffer = 2;
        const pagesToPreload = [];
        
        for (let i = this.currentPage - buffer; i <= this.currentPage + buffer; i++) {
            if (i > 0 && i <= this.totalPages) {
                pagesToPreload.push(i);
            }
        }
        
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
        
        document.querySelectorAll('.page').forEach((page) => {
            const pageNum = parseInt(page.dataset.page);
            if (pageNum === this.currentPage) {
                page.classList.add('active');
            } else {
                page.classList.remove('active');
            }
        });
        
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

document.addEventListener('DOMContentLoaded', () => {
    new PortfolioViewer();
});
