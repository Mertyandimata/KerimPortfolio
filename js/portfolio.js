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
        this.loadedPages = {};
        
        this.init();
    }
    
    async init() {
        console.log('Portfolio başlatılıyor...');
        
        // Önce tüm slide'ları sırayla oluştur (boş placeholder'lar)
        this.createAllSlides();
        
        // İlk sayfaları yükle
        await this.loadInitialPages();
        
        // Event listener'ları kur
        this.setupEventListeners();
        
        // Loading'i kapat
        this.hideLoading();
        
        // UI güncelle
        this.updateUI();
    }
    
    createAllSlides() {
        // 1'den 65'e kadar tüm slide'ları oluştur (henüz resim yok)
        for (let i = 1; i <= this.totalPages; i++) {
            const slide = document.createElement('div');
            slide.className = 'slide';
            slide.dataset.page = i;
            slide.id = `slide-${i}`;
            
            // Placeholder div
            const placeholder = document.createElement('div');
            placeholder.className = 'placeholder';
            placeholder.textContent = `Sayfa ${i} yükleniyor...`;
            slide.appendChild(placeholder);
            
            this.slides.appendChild(slide);
        }
        
        console.log(`${this.totalPages} slide oluşturuldu`);
    }
    
    getImagePath(pageNum) {
        // page-01.png, page-02.png formatı
        const paddedNum = pageNum.toString().padStart(2, '0');
        return `assets/images/page-${paddedNum}.png`;
    }
    
    async loadInitialPages() {
        // İlk 5 sayfayı yükle
        const promises = [];
        for (let i = 1; i <= Math.min(5, this.totalPages); i++) {
            promises.push(this.loadPage(i));
        }
        
        await Promise.all(promises);
        console.log('İlk sayfalar yüklendi');
    }
    
    async loadPage(pageNum) {
        // Zaten yüklenmişse tekrar yükleme
        if (this.loadedPages[pageNum]) return;
        
        return new Promise((resolve) => {
            const img = new Image();
            const imagePath = this.getImagePath(pageNum);
            
            img.onload = () => {
                // Doğru slide'ı bul
                const slide = document.getElementById(`slide-${pageNum}`);
                
                if (slide) {
                    // Placeholder'ı kaldır
                    slide.innerHTML = '';
                    
                    // Resmi ekle
                    img.className = 'page-image';
                    slide.appendChild(img);
                    
                    this.loadedPages[pageNum] = true;
                    console.log(`Sayfa ${pageNum} yüklendi`);
                    
                    // Progress güncelle
                    const loadedCount = Object.keys(this.loadedPages).length;
                    const progress = Math.min(100, (loadedCount / 5) * 100);
                    this.progress.style.width = `${progress}%`;
                }
                
                resolve();
            };
            
            img.onerror = () => {
                console.error(`Sayfa ${pageNum} yüklenemedi: ${imagePath}`);
                
                // Hata durumunda da slide'ı güncelle
                const slide = document.getElementById(`slide-${pageNum}`);
                if (slide) {
                    slide.innerHTML = `<div class="error">Sayfa ${pageNum} yüklenemedi</div>`;
                }
                
                resolve();
            };
            
            img.src = imagePath;
        });
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
            await this.goToPage(this.currentPage);
        }
    }
    
    async goToPage(pageNum) {
        this.isTransitioning = true;
        
        // Sayfayı yükle (henüz yüklenmemişse)
        await this.loadPage(pageNum);
        
        // Yakındaki sayfaları yükle
        this.preloadNearbyPages(pageNum);
        
        // Pozisyonu ayarla (pageNum - 1 çünkü array 0'dan başlar)
        const translateX = -(pageNum - 1) * 100;
        this.slides.style.transform = `translateX(${translateX}vw)`;
        
        // UI güncelle
        this.currentPage = pageNum;
        this.updateUI();
        
        setTimeout(() => {
            this.isTransitioning = false;
        }, 600);
    }
    
    updateUI() {
        this.pageInfo.textContent = `${this.currentPage} / ${this.totalPages}`;
        this.prevBtn.disabled = this.currentPage === 1;
        this.nextBtn.disabled = this.currentPage === this.totalPages;
    }
    
    preloadNearbyPages(currentPage) {
        // Yakındaki sayfaları yükle
        for (let i = -2; i <= 2; i++) {
            const pageNum = currentPage + i;
            if (pageNum > 0 && pageNum <= this.totalPages) {
                this.loadPage(pageNum);
            }
        }
    }
}

// Portfolio'yu başlat
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM yüklendi, portfolio başlatılıyor...');
    new Portfolio();
});
