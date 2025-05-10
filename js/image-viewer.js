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
        
        console.log('Starting Portfolio Viewer...');
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
        console.log('Loading initial pages...');
        // İlk 3 sayfayı yükle
        for (let i = 1; i <= Math.min(3, this.totalPages); i++) {
            await this.loadPage(i);
        }
    }
    
    formatPageNumber(num) {
        // 1 -> 01, 2 -> 02, 10 -> 10
        return num.toString().padStart(2, '0');
    }
    
    async loadPage(pageNum) {
        if (this.loadedPages.has(pageNum)) return;
        
        // Dosya isimleri: page-01.png, page-02.png formatında
        const formattedNum = this.formatPageNumber(pageNum);
        const imageSrc = `assets/images/page-${formattedNum}.png`;
        
        console.log(`Loading page ${pageNum} from ${imageSrc}`);
        
        try {
            await this.loadImage(imageSrc, pageNum);
            this.loadedPages.add(pageNum);
            console.log(`Successfully loaded page ${pageNum}`);
            
            // Progress bar
            const progress = (this.loadedPages.size / Math.min(3, this.totalPages)) * 100;
            this.progressBar.style.width = `${progress}%`;
        } catch (error) {
            console.error(`Failed to load page ${pageNum}:`, error);
        }
    }
    
    loadImage(src, pageNum) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                console.log(`Image loaded: ${src}`);
                this.createPageElement(img.src, pageNum);
                resolve();
            };
            
            img.onerror = (e) => {
                console.error(`Image load error for ${src}`);
                reject(e);
            };
            
            img.src = src;
        });
    }
    
    createPageElement(src, pageNum) {
        // Eğer sayfa zaten varsa ekleme
        if (document.querySelector(`.page[data-page="${pageNum}"]`)) {
            return;
        }
        
        const pageDiv = document.createElement('div');
        pageDiv.className = `page ${pageNum === 1 ? 'active' : ''}`;
        pageDiv.dataset.page = pageNum;
        
        const img = document.createElement('img');
        img.src = src;
        img.className = 'page-image';
        
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
            duration: 0.5,
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
        }, { passive: true });
        
        this.pagesWrapper.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            
            if (Math.abs(diff) > 50) {
                if (diff > 0) this.goToNextPage();
                else this.goToPrevPage();
            }
        }, { passive: true });
    }
    
    async goToPrevPage() {
        if (this.currentPage > 1 && !this.isLoading) {
            this.isLoading = true;
            this.currentPage--;
            
            await this.ensurePageLoaded(this.currentPage);
            this.transitionToPage();
        }
    }
    
    async goToNextPage() {
        if (this.currentPage < this.totalPages && !this.isLoading) {
            this.isLoading = true;
            this.currentPage++;
            
            await this.ensurePageLoaded(this.currentPage);
            this.transitionToPage();
        }
    }
    
    async ensurePageLoaded(pageNum) {
        if (!this.loadedPages.has(pageNum)) {
            await this.loadPage(pageNum);
        }
    }
    
    transitionToPage() {
        const translateX = -(this.currentPage - 1) * 100;
        
        gsap.to(this.pagesWrapper, {
            x: `${translateX}vw`,
            duration: 0.8,
            ease: "power3.inOut",
            onComplete: () => {
                this.isLoading = false;
                // Yakın sayfaları önceden yükle
                this.preloadNearbyPages();
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
    
    async preloadNearbyPages() {
        // Önde ve arkada 2'şer sayfa yükle
        const pagesToLoad = [];
        for (let i = -2; i <= 2; i++) {
            const pageNum = this.currentPage + i;
            if (pageNum > 0 && pageNum <= this.totalPages && !this.loadedPages.has(pageNum)) {
                pagesToLoad.push(pageNum);
            }
        }
        
        // Paralel yükle
        pagesToLoad.forEach(pageNum => this.loadPage(pageNum));
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
