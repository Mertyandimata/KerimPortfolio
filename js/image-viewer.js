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
        
        this.init();
    }
    
    async init() {
        try {
            await this.loadImages();
            this.setupEventListeners();
            this.hideLoadingScreen();
        } catch (error) {
            console.error('Error:', error);
            this.showError();
        }
    }
    
    async loadImages() {
        // PNG dosyalarını bul
        const imagePromises = [];
        let pageNum = 1;
        
        // Test için ilk 10 sayfa
        while (pageNum <= 30) {
            const imageSrc = `assets/images/page-${pageNum}.png`;
            imagePromises.push(this.loadImage(imageSrc, pageNum));
            pageNum++;
        }
        
        const results = await Promise.allSettled(imagePromises);
        this.totalPages = results.filter(r => r.status === 'fulfilled').length;
        this.pageIndicator.textContent = `1 / ${this.totalPages}`;
    }
    
    loadImage(src, pageNum) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.createPageElement(src, pageNum);
                const progress = (pageNum / 30) * 100;
                this.progressBar.style.width = `${progress}%`;
                resolve();
            };
            img.onerror = () => reject();
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
        
        // Touch swipe desteği
        let touchStartX = 0;
        let touchEndX = 0;
        
        this.pagesWrapper.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        this.pagesWrapper.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            if (touchStartX - touchEndX > 50) {
                this.goToNextPage();
            } else if (touchEndX - touchStartX > 50) {
                this.goToPrevPage();
            }
        });
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
        const translateX = -(this.currentPage - 1) * 100;
        
        gsap.to(this.pagesWrapper, {
            x: `${translateX}vw`,
            duration: 0.8,
            ease: "power2.inOut",
            onComplete: () => {
                this.isLoading = false;
            }
        });
        
        // Update active states
        document.querySelectorAll('.page').forEach((page, index) => {
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
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new PortfolioViewer();
});
