// Dashboard Helper Module for Checkbox Selection
// Provides utility functions for table row selection and data export

class DashboardHelper {
    constructor() {
        this.currentTableData = {
            'master-table': [],
            'sales-all-table': [],
            'sales-branch-table': [],
            'subscription-all-table': [],
            'subscription-branch-table': []
        };
    }

    // Store current data for a table
    storeTableData(tableId, data) {
        this.currentTableData[tableId] = data || [];
    }

    // Setup checkbox event handlers for a table
    setupCheckboxHandlers(tableId) {
        const table = document.getElementById(tableId);
        if (!table) return;

        // Get select-all checkbox
        const selectAllId = tableId.replace('-table', '-select-all');
        const selectAllCheckbox = document.getElementById(selectAllId);
        
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.toggleAllCheckboxes(tableId, e.target.checked);
            });
        }

        // Add event listeners to individual row checkboxes
        const rowCheckboxes = table.querySelectorAll('.row-checkbox');
        rowCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateRowSelection(checkbox);
                this.updateSelectAllState(tableId);
            });
        });
    }

    // Toggle all checkboxes in a table
    toggleAllCheckboxes(tableId, checked) {
        const table = document.getElementById(tableId);
        if (!table) return;

        const checkboxes = table.querySelectorAll('.row-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            this.updateRowSelection(checkbox);
        });
    }

    // Update row visual state based on checkbox
    updateRowSelection(checkbox) {
        const row = checkbox.closest('tr');
        if (!row) return;

        if (checkbox.checked) {
            row.classList.add('selected');
        } else {
            row.classList.remove('selected');
        }
    }

    // Update select-all checkbox state
    updateSelectAllState(tableId) {
        const table = document.getElementById(tableId);
        const selectAllId = tableId.replace('-table', '-select-all');
        const selectAllCheckbox = document.getElementById(selectAllId);
        
        if (!table || !selectAllCheckbox) return;

        const allCheckboxes = Array.from(table.querySelectorAll('.row-checkbox'));
        const checkedCheckboxes = allCheckboxes.filter(cb => cb.checked);

        if (checkedCheckboxes.length === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (checkedCheckboxes.length === allCheckboxes.length) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        }
    }

    // Get selected rows data from a table
    getSelectedRows(tableId) {
        const table = document.getElementById(tableId);
        if (!table) return [];

        const selectedData = [];
        const checkboxes = table.querySelectorAll('.row-checkbox:checked');
        
        checkboxes.forEach(checkbox => {
            const row = checkbox.closest('tr');
            const index = parseInt(row.getAttribute('data-index'));
            
            if (!isNaN(index) && this.currentTableData[tableId][index]) {
                selectedData.push(this.currentTableData[tableId][index]);
            }
        });

        return selectedData;
    }

    // Get count of selected rows
    getSelectedCount(tableId) {
        const table = document.getElementById(tableId);
        if (!table) return 0;

        const checkboxes = table.querySelectorAll('.row-checkbox:checked');
        return checkboxes.length;
    }

    // Add checkbox column to table header
    addCheckboxToHeader(headerRow, selectAllId) {
        const th = document.createElement('th');
        th.className = 'checkbox-header';
        th.setAttribute('rowspan', '3');
        th.innerHTML = `<input type="checkbox" class="table-checkbox" id="${selectAllId}">`;
        
        // Insert as first column
        if (headerRow.firstChild) {
            headerRow.insertBefore(th, headerRow.firstChild);
        } else {
            headerRow.appendChild(th);
        }
    }

    // Add checkbox cell to table row
    addCheckboxToRow(row, index) {
        const td = document.createElement('td');
        td.className = 'checkbox-cell';
        td.innerHTML = '<input type="checkbox" class="table-checkbox row-checkbox">';
        
        // Set data-index attribute on row
        row.setAttribute('data-index', index);
        
        // Insert as first column
        if (row.firstChild) {
            row.insertBefore(td, row.firstChild);
        } else {
            row.appendChild(td);
        }
    }

    // Initialize checkboxes for an existing table
    initializeTableCheckboxes(tableId) {
        const table = document.getElementById(tableId);
        if (!table) return;

        console.log(`Initializing checkboxes for ${tableId}`);

        const selectAllId = tableId.replace('-table', '-select-all');

        // Add checkbox to header (first header row)
        const headerRows = table.querySelectorAll('thead tr');
        if (headerRows.length > 0) {
            this.addCheckboxToHeader(headerRows[0], selectAllId);
        }

        // Add checkbox to each body row
        const bodyRows = table.querySelectorAll('tbody tr');
        bodyRows.forEach((row, index) => {
            this.addCheckboxToRow(row, index);
        });

        // Setup event handlers
        this.setupCheckboxHandlers(tableId);
    }
}

// Export for global use
window.DashboardHelper = DashboardHelper;
