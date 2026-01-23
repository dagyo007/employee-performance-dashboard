// Simple script to add checkboxes to dashboard tables
// This will be injected after table rendering

(function() {
    // Wait for tables to be rendered
    window.addCheckboxesToTables = function() {
        console.log('Adding checkboxes to all tables...');
        
        const tables = [
            { id: 'master-table', selectAllId: 'master-select-all' },
            { id: 'sales-all-table', selectAllId: 'sales-all-select-all' },
            { id: 'sales-branch-table', selectAllId: 'sales-branch-select-all' },
            { id: 'subscription-all-table', selectAllId: 'subscription-all-select-all' },
            { id: 'subscription-branch-table', selectAllId: 'subscription-branch-select-all' }
        ];
        
        tables.forEach(tableInfo => {
            const table = document.getElementById(tableInfo.id);
            if (!table) {
                console.log(`Table ${tableInfo.id} not found`);
                return;
            }
            
            console.log(`Processing table: ${tableInfo.id}`);
            
            // Add checkbox to first header row
            const headerRow = table.querySelector('thead tr:first-child');
            if (headerRow && !headerRow.querySelector('.checkbox-header')) {
                const th = document.createElement('th');
                th.className = 'checkbox-header';
                th.setAttribute('rowspan', headerRow.querySelectorAll('th[rowspan]').length > 0 ? '3' : '2');
                th.innerHTML = `<input type="checkbox" class="table-checkbox" id="${tableInfo.selectAllId}">`;
                headerRow.insertBefore(th, headerRow.firstChild);
                console.log(`Added header checkbox to ${tableInfo.id}`);
            }
            
            // Add checkbox to each body row
            const bodyRows = table.querySelectorAll('tbody tr');
            bodyRows.forEach((row, index) => {
                if (!row.querySelector('.checkbox-cell')) {
                    const td = document.createElement('td');
                    td.className = 'checkbox-cell';
                    td.innerHTML = '<input type="checkbox" class="table-checkbox row-checkbox">';
                    row.setAttribute('data-index', index);
                    row.insertBefore(td, row.firstChild);
                }
            });
            
            console.log(`Added ${bodyRows.length} row checkboxes to ${tableInfo.id}`);
        });
        
        console.log('Checkboxes added successfully!');
    };
})();
