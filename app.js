// Main Application Controller for Store Evaluation System
// Handles UI interactions and orchestrates modules

class App {
    constructor() {
        this.dataProcessor = new DataProcessor();
        this.evaluationEngine = new EvaluationEngine();
        this.competitionAnalyzer = new CompetitionAnalyzer();
        this.dashboard = new Dashboard(this.dataProcessor, this.evaluationEngine, this.competitionAnalyzer);
        this.excelExporter = new ExcelExporter(this.dataProcessor, this.evaluationEngine, this.competitionAnalyzer);
        
        this.currentSection = 'upload';
        this.init();
    }

    // Initialize application
    init() {
        this.setupNavigation();
        this.setupDataInput();
        this.setupActionButtons();

        // Demo Data Button
        const loadDemoBtn = document.getElementById('load-demo-btn');
        if (loadDemoBtn) {
            loadDemoBtn.addEventListener('click', () => this.loadDemoData());
        }

        this.showSection('master'); // Default to MASTER
    }

    // Setup navigation between sections
    setupNavigation() {
        const navTabs = document.querySelectorAll('.nav-tab');
        
        navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const section = tab.getAttribute('data-section');
                this.showSection(section);
                
                // Update active tab
                navTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });

        // Setup sub-navigation
        const subTabs = document.querySelectorAll('.sub-tab');
        subTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const subSection = tab.getAttribute('data-sub');
                const parentSection = tab.closest('.section').id.replace('-section', '');
                
                this.showSubSection(parentSection, subSection);
                
                // Update active sub-tab within its parent section
                tab.parentElement.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });
    }

    // Show specific section
    showSection(sectionName) {
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => section.classList.remove('active'));
        
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;
            
            // Standard render
            if (['master', 'sales', 'subscription'].includes(sectionName)) {
                this.dashboard.renderSection(sectionName);
                
                // FORCE: Find active sub-tab or default to first one and trigger render
                const activeSubTab = targetSection.querySelector('.sub-tab.active') 
                                   || targetSection.querySelector('.sub-tab');
                                   
                if (activeSubTab) {
                    const subSection = activeSubTab.getAttribute('data-sub');
                    this.showSubSection(sectionName, subSection);
                }
            }
        }
    }

    // Show specific sub-section
    showSubSection(parentSection, subSectionName) {
        const containerId = `${parentSection}-${subSectionName}-content`;
        const container = document.getElementById(containerId);
        
        if (container) {
            // Hide all sub-sections in this section
            const section = document.getElementById(`${parentSection}-section`);
            section.querySelectorAll('.sub-section').forEach(s => s.classList.remove('active'));
            section.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
            
            // Show target
            container.classList.add('active');
            section.querySelector(`.sub-tab[data-sub="${subSectionName}"]`)?.classList.add('active');
            
            // Render data if available
            this.dashboard.renderSubSection(parentSection, subSectionName);
        }
    }

    // Setup data input handlers
    setupDataInput() {
        // File input handlers
        document.getElementById('master-file')?.addEventListener('change', (e) => this.handleFileUpload(e, 'master'));
        document.getElementById('sales-file')?.addEventListener('change', (e) => this.handleFileUpload(e, 'sales'));
        document.getElementById('subscription-file')?.addEventListener('change', (e) => this.handleFileUpload(e, 'subscription'));

        // Demo data button
        document.getElementById('load-demo-btn')?.addEventListener('click', () => this.loadDemoData());

        // Clear data button
        document.getElementById('clear-data-btn')?.addEventListener('click', () => {
            if (confirm('모든 데이터를 초기화하시겠습니까?')) {
                this.clearAllData();
            }
        });

        // Setup RAW data input handlers
        this.setupRawDataInput();
    }

    // Setup RAW data input handlers
    setupRawDataInput() {
        // MASTER RAW data
        document.getElementById('load-master-raw-btn')?.addEventListener('click', () => {
            const rawText = document.getElementById('master-raw-input').value;
            this.loadRawData(rawText, 'master');
        });

        // Sales ALL RAW data
        document.getElementById('load-sales-all-raw-btn')?.addEventListener('click', () => {
            const rawText = document.getElementById('sales-all-raw-input').value;
            this.loadRawData(rawText, 'sales');
        });

        // Sales BRANCH RAW data
        document.getElementById('load-sales-branch-raw-btn')?.addEventListener('click', () => {
            const rawText = document.getElementById('sales-branch-raw-input').value;
            this.loadRawData(rawText, 'sales');
        });

        // Subscription ALL RAW data
        document.getElementById('load-subscription-all-raw-btn')?.addEventListener('click', () => {
            const rawText = document.getElementById('subscription-all-raw-input').value;
            this.loadRawData(rawText, 'subscription');
        });

        // Subscription BRANCH RAW data
        document.getElementById('load-subscription-branch-raw-btn')?.addEventListener('click', () => {
            const rawText = document.getElementById('subscription-branch-raw-input').value;
            this.loadRawData(rawText, 'subscription');
        });
    }

    // Load RAW data from textarea
    async loadRawData(rawText, type) {
        try {
            this.showLoading(true);

            // Parse RAW text - this already returns processed data!
            const result = this.dataProcessor.parseRawText(rawText, type);

            // Directly assign to performanceData (no double processing)
            if (!this.dataProcessor.performanceData) {
                this.dataProcessor.performanceData = {};
            }

            if (type === 'sales' || type === 'subscription') {
                // Handle branch vs summary detection
                if (result.isBranch) {
                    this.dataProcessor.performanceData[type + 'Branch'] = result.data;
                } else {
                    this.dataProcessor.performanceData[type] = result.data;
                }
            } else {
                this.dataProcessor.performanceData[type] = result;
            }

            // Render the appropriate section
            this.dashboard.renderSection(type);

            this.showToast(`${type.toUpperCase()} 데이터가 성공적으로 로드되었습니다!`, 'success');
            this.showLoading(false);
        } catch (error) {
            console.error('RAW data load error:', error);
            this.showToast(`데이터 로드 실패: ${error.message}`, 'error');
            this.showLoading(false);
        }
    }

    // Generic file upload handler
    async handleFileUpload(event, type) {
        const file = event.target.files[0];
        if (!file) return;

        this.showLoading(true);
        try {
            const data = await this.dataProcessor.parsePerformanceFile(file, type);
            await this.dataProcessor.loadPerformanceData(data, type);
            
            document.getElementById(`${type}-file-name`).textContent = `✓ ${file.name}`;
            document.getElementById(`${type}-upload-area`).classList.add('active');
            
            this.showToast(`${type.toUpperCase()} 데이터 로드 완료!`, 'success');
            this.updateDataPreview();
        } catch (error) {
            console.error(`${type} file error:`, error);
            this.showToast(`${type} 파일 처리 중 오류: ` + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Load Demo Data
    async loadDemoData() {
        console.log("Loading Demo Data initiated...");
        if (!window.DEMO_DATA) {
            console.error("DEMO_DATA not found!");
            this.showToast('데모 데이터를 찾을 수 없습니다.', 'error');
            return;
        }
        
        this.showLoading(true);
        let errorCount = 0;

        try {
            // Master
            try {
                console.log("Processing Master Data...");
                if (window.DEMO_DATA.master) {
                    const masterProcessed = this.dataProcessor.processMasterData(window.DEMO_DATA.master);
                    this.dataProcessor.performanceData.master = masterProcessed;
                }
            } catch (e) {
                console.error("Master data error:", e);
                errorCount++;
            }

            // Sales
            try {
                console.log("Processing Sales Data...");
                if (window.DEMO_DATA.sales) {
                    const salesResult = this.dataProcessor.processSalesData(window.DEMO_DATA.sales);
                    this.dataProcessor.performanceData.sales = salesResult.data;
                }
                if (window.DEMO_DATA.salesBranch) {
                    this.dataProcessor.performanceData.salesBranch = window.DEMO_DATA.salesBranch;
                }
            } catch (e) {
                console.error("Sales data error:", e);
                errorCount++;
            }
            
            // Subscription
            try {
                console.log("Processing Subscription Data...");
                if (window.DEMO_DATA.subscription) {
                    const subResult = this.dataProcessor.processSubscriptionData(window.DEMO_DATA.subscription);
                    this.dataProcessor.performanceData.subscription = subResult.data;
                }
                if (window.DEMO_DATA.subscriptionBranch) {
                    this.dataProcessor.performanceData.subscriptionBranch = window.DEMO_DATA.subscriptionBranch;
                }
            } catch (e) {
                console.error("Subscription data error:", e);
                errorCount++;
            }
            
            console.log("Data processing complete. Updating UI...", this.dataProcessor.performanceData);
            
            this.showToast(errorCount === 0 ? '데모 데이터가 성공적으로 로드되었습니다.' : '일부 데이터 로드 중 오류가 발생했습니다.', errorCount === 0 ? 'success' : 'warning');
            this.updateDataPreview();
            
            // Explicitly render all sections
            if (this.dashboard) {
                console.log("Rendering Dashboard Sections...");
                try { this.dashboard.renderSection('master'); } catch (e) { console.error("Render Master error:", e); }
                try { this.dashboard.renderSection('sales'); } catch (e) { console.error("Render Sales error:", e); }
                try { this.dashboard.renderSection('subscription'); } catch (e) { console.error("Render Subscription error:", e); }
            }

            // Switch to Master tab by default
            const masterTab = document.querySelector('.nav-tab[data-section="master"]');
            if (masterTab) masterTab.click();
            
        } catch (error) {
            console.error('Critical demo data load failure:', error);
            this.showToast('치명적인 오류가 발생했습니다: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Update data preview table
    updateDataPreview() {
        const previewCard = document.getElementById('data-preview-card');
        const tbody = document.getElementById('preview-table-body');
        
        if (!this.dataProcessor.performanceData) {
            previewCard.style.display = 'none';
            return;
        }

        previewCard.style.display = 'block';
        tbody.innerHTML = '';

        // Show summary of loaded data
        const types = ['master', 'sales', 'subscription'];
        types.forEach(type => {
            const data = this.dataProcessor.performanceData[type];
            if (data && data.length > 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td colspan="3"><strong>${type.toUpperCase()} 데이터</strong></td>
                    <td colspan="2">${data.length}개의 항목 로드됨</td>
                    <td colspan="1"><span class="badge badge-success">✓ 완료</span></td>
                `;
                tbody.appendChild(tr);
            }
        });
    }

    // Setup action buttons for new categories
    setupActionButtons() {
        const exportMasterBtn = document.getElementById('export-master-btn');
        if (exportMasterBtn) {
            exportMasterBtn.addEventListener('click', () => {
                const data = this.dataProcessor.performanceData?.master;
                if (!data) return this.showToast('데이터가 없습니다.', 'error');
                this.excelExporter.exportMasterReport(data);
                this.showToast('Excel 내보내기 완료', 'success');
            });
        }
    }

    // Clear all data
    clearAllData() {
        this.dataProcessor.clearData();
        this.dataProcessor.performanceData = null;
        this.dashboard.clearCharts();
        this.updateDataPreview();
        
        // Reset upload indicators
        ['master', 'sales', 'subscription'].forEach(type => {
            const fileNameElem = document.getElementById(`${type}-file-name`);
            const uploadAreaElem = document.getElementById(`${type}-upload-area`);
            if (fileNameElem) fileNameElem.textContent = '';
            if (uploadAreaElem) uploadAreaElem.classList.remove('active');
            const inputElem = document.getElementById(`${type}-file`);
            if (inputElem) inputElem.value = '';
        });
        
        this.showToast('모든 데이터가 초기화되었습니다.', 'info');
    }

    // Populate channel filter dropdown
    populateChannelFilter() {
        const channelFilter = document.getElementById('filter-channel');
        if (!channelFilter) return;

        const channels = this.dataProcessor.getChannels();
        
        channelFilter.innerHTML = '<option value="">전체 채널</option>';
        channels.forEach(channel => {
            const option = document.createElement('option');
            option.value = channel;
            option.textContent = channel;
            channelFilter.appendChild(option);
        });
    }

    // Setup export buttons
    setupExportButtons() {
        // Comprehensive report
        document.getElementById('export-comprehensive-btn').addEventListener('click', () => {
            this.exportReport('comprehensive');
        });

        // Performers report
        document.getElementById('export-performers-btn').addEventListener('click', () => {
            this.exportReport('performers');
        });

        // Channel report
        document.getElementById('export-channel-btn').addEventListener('click', () => {
            this.exportReport('channel');
        });
    }

    // Export report
    exportReport(type) {
        const processedData = this.dashboard.getProcessedData();
        
        if (processedData.length === 0) {
            this.showToast('내보낼 데이터가 없습니다. 먼저 데이터를 입력해주세요.', 'error');
            return;
        }

        this.showLoading(true);

        try {
            let fileName;
            
            switch (type) {
                case 'comprehensive':
                    fileName = this.excelExporter.exportStoreEvaluationReport(processedData);
                    break;
                case 'performers':
                    fileName = this.excelExporter.exportPerformersReport(processedData);
                    break;
                case 'channel':
                    fileName = this.excelExporter.exportChannelReport(processedData);
                    break;
            }

            this.showToast(`리포트를 다운로드했습니다: ${fileName}`, 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showToast('리포트 생성 중 오류가 발생했습니다: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Show/hide loading overlay
    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (show) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }

    // Show toast notification
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
        
        toast.innerHTML = `
            <span style="font-size: 1.25rem;">${icon}</span>
            <div>${message}</div>
        `;
        
        container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s reverse';
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 5000);
    }
}

// Initialize app when DOM is ready
let app;
let dashboard; // Global reference for detail modal

document.addEventListener('DOMContentLoaded', () => {
    app = new App();
    dashboard = app.dashboard; // Expose for modal onclick
    console.log('지점 평가 시스템이 준비되었습니다!');
});
