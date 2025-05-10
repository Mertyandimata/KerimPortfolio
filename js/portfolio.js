class Portfolio {
    constructor() {
        this.currentPage = 1;
        this.totalPages = 65;
        this.slides = document.getElementById('slides');
        this.loading = document.getElementById('loading');
        this.progress = document.getElementById('progress');
        this.pageInfo = document.getElementById('pageInfo');
        this.prevBtn = document.getElementById('prev');
        this.nextBtn = document.getElementById('next');
        this.isTransitioning = false;
        
        this.init();
    }
    
    async init() {
        this.pageInfo.textContent = `${this.currentPage} / ${this.totalPages}`;
        this.prevBtn.disabled = true;
        
        await this.loadImages();
        this.setupEventListeners();
        this.hideLoading();
    }
    
    getImagePath(pageNum) {
        // page-01.png, page-02.png formatı için
        const paddedNum = pageNum.toString().padStart(2, '0');
        return `assets/images/page-${paddedNum}.png`;
    }
    
    async loadImages() {
        const loadPromises = [];
        
        // İlk birkaç resmi önceden yükle
        for (let i = 1; i <= Math.min(5, this.totalPages); i++) {
            loadPromises.push(this.createSlide(i));
        }
        
        await Promise.all(loadPromises);
        
        // Progress bar'ı güncelle
        this.progress.style.width = '100%';
    }
    
    createSlide(pageNum) {
        return new Promise((resolve) => {
            const slide = document.createElement('div');
            slide.className = 'slide';
            slide.dataset.page = pageNum;
            
            const img = new Image();
            img.src = this.getImagePath(pageNum);
            
            img.onload = () => {
                slide.appendChild(img);
                this.slides.appendChild(slide);
                
                // Progress güncelle
                const loadedCount = this.slides.children.length;
                const progress = (loadedCount / Math.min(5, this.totalPages)) * 100;
                this.progress.style.width = `${progress}%`;
                
                resolve();
            };
            
            img.onerror = () => {
                console.error(`Failed to load page ${pageNum}`);
                resolve();
            };
        });
    }
    
    async ensurePageLoaded(pageNum) {
        if (!document.querySelector(`.slide[data-page="${pageNum}"]`)) {
            await this.createSlide(pageNum);
        }
    }
    
    hideLoading() {
        this.loading.classList.add('hidden');
        setTimeout(() => {
            this.loading.style.display = 'none';
        }, 500);
    }
    
    setupEventListeners() {
        this.prevBtn.addEventListener('click', () => this.previousPage());
        this.nextBtn.addEventListener('click', () => this.nextPage());
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.previousPage();
            if (e.key === 'ArrowRight') this.nextPage();
        });
        
        // Touch swipe
        let touchStartX = 0;
        
        this.slides.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });
        
        this.slides.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchStartX - touchEndX;
            
            if (Math.abs(diff) > 50) {
                if (diff > 0) this.nextPage();
                else this.previousPage();
            }
        });
    }
    
    async previousPage() {
        if (this.currentPage > 1 && !this.isTransitioning) {
            this.currentPage--;
            await this.goToPage(this.currentPage);
        }
    }
    
    async nextPage() {
        if (this.currentPage < this.totalPages && !this.isTransitioning) {
            this.currentPage++;
            await this.ensurePageLoaded(this.currentPage);
            await this.goToPage(this.currentPage);
        }
    }
    
    async goToPage(pageNum) {
        this.isTransitioning = true;
        
        // Yakındaki sayfaları önceden yükle
        this.preloadNearbyPages(pageNum);
        
        // Slide pozisyonunu ayarla
        const translateX = -(pageNum - 1) * 100;
        this.slides.style.transform = `translateX(${translateX}vw)`;
        
        // UI güncelle
        this.pageInfo.textContent = `${pageNum} / ${this.totalPages}`;
        this.prevBtn.disabled = pageNum === 1;
        this.nextBtn.disabled = pageNum === this.totalPages;
        
        setTimeout(() => {
            this.isTransitioning = false;
        }, 600);
    }
    
    preloadNearbyPages(currentPage) {
        // Önde ve arkada 2'şer sayfa yükle
        for (let i = -2; i <= 2; i++) {
            const pageNum = currentPage + i;
            if (pageNum > 0 && pageNum <= this.totalPages) {
                this.ensurePageLoaded(pageNum);
            }
        }
    }
}

// Start the portfolio
document.addEventListener('DOMContentLoaded', () => {
    new Portfolio();
});
