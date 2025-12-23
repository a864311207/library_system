// API基础URL
const API_BASE_URL = 'http://localhost:5000/api';

// 全局变量
let currentAction = null;
let currentBookId = null;

// 图表实例
let bookStatusChart = null;
let authorDistributionChart = null;
let borrowTrendChart = null;

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 检查服务器状态
    checkServerStatus();

    // 加载图书列表
    loadBooks();

    // 设置标签页切换
    setupTabs();

    // 设置标签页切换监听，当切换到可视化标签时加载图表
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            if (tabId === 'visualization') {
                // 切换到可视化标签时，加载所有图表
                setTimeout(() => {
                    loadAllCharts();
                }, 100);
            }
        });
    });

    // 设置自动刷新
    setInterval(checkServerStatus, 30000); // 每30秒检查一次服务器状态

    // 如果当前是可视化标签页，加载图表
    const activeTab = document.querySelector('.tab.active');
    if (activeTab && activeTab.getAttribute('data-tab') === 'visualization') {
        setTimeout(() => {
            loadAllCharts();
        }, 500);
    }
});

// 检查服务器状态
async function checkServerStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            document.getElementById('serverStatus').textContent = '服务器状态: 在线';
            document.getElementById('serverStatus').style.color = '#28a745';
        } else {
            document.getElementById('serverStatus').textContent = '服务器状态: 离线';
            document.getElementById('serverStatus').style.color = '#dc3545';
        }
    } catch (error) {
        document.getElementById('serverStatus').textContent = '服务器状态: 离线';
        document.getElementById('serverStatus').style.color = '#dc3545';
    }
}

// 设置标签页切换
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');

            // 移除所有标签的active类
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // 添加当前标签的active类
            this.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

// 显示消息
function showMessage(message, type = 'info') {
    const messageBox = document.getElementById('messageBox');
    messageBox.textContent = message;
    messageBox.className = `message ${type}`;

    // 3秒后自动隐藏
    setTimeout(() => {
        messageBox.textContent = '';
        messageBox.className = 'message';
    }, 3000);
}

// 显示确认对话框
function showConfirmDialog(message, action, bookId = null) {
    document.getElementById('confirmMessage').textContent = message;
    currentAction = action;
    currentBookId = bookId;
    document.getElementById('confirmDialog').classList.add('active');
}

// 确认操作
function confirmAction() {
    if (currentAction === 'deleteBook') {
        deleteBookConfirmed();
    }
    cancelAction();
}

// 取消操作
function cancelAction() {
    document.getElementById('confirmDialog').classList.remove('active');
    currentAction = null;
    currentBookId = null;
}

// ==================== 图书管理功能 ====================

// 添加图书
async function addBook() {
    const title = document.getElementById('bookTitle').value.trim();
    const author = document.getElementById('bookAuthor').value.trim();
    const isbn = document.getElementById('bookIsbn').value.trim();

    if (!title || !author || !isbn) {
        showMessage('请填写所有字段', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/books`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, author, isbn })
        });

        const data = await response.json();

        if (data.success) {
            showMessage(data.message, 'success');
            // 清空表单
            document.getElementById('bookTitle').value = '';
            document.getElementById('bookAuthor').value = '';
            document.getElementById('bookIsbn').value = '';
            // 刷新图书列表
            loadBooks();
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('网络错误，请检查服务器连接', 'error');
    }
}

// 加载图书列表
async function loadBooks() {
    try {
        const response = await fetch(`${API_BASE_URL}/books`);
        const data = await response.json();

        if (data.success) {
            renderBooksTable(data.books);
        } else {
            showMessage('加载图书列表失败', 'error');
        }
    } catch (error) {
        showMessage('网络错误，请检查服务器连接', 'error');
    }
}

// 渲染图书表格
function renderBooksTable(books) {
    const tbody = document.getElementById('booksTableBody');
    tbody.innerHTML = '';

    if (books.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">暂无图书</td></tr>';
        return;
    }

    books.forEach(book => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${book.id}</td>
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.isbn}</td>
            <td class="${book.is_borrowed ? 'status-borrowed' : 'status-available'}">
                ${book.is_borrowed ? '已借出' : '可借阅'}
            </td>
            <td>
                <button class="action-btn delete-btn" onclick="deleteBook(${book.id})">
                    <i class="fas fa-trash"></i> 删除
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// 删除图书
function deleteBook(bookId) {
    showConfirmDialog(`确定要删除ID为${bookId}的图书吗？`, 'deleteBook', bookId);
}

// 确认删除图书
async function deleteBookConfirmed() {
    if (!currentBookId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/books/${currentBookId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showMessage(data.message, 'success');
            loadBooks(); // 刷新列表
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('网络错误，请检查服务器连接', 'error');
    }
}

// 修改图书信息
async function updateBook() {
    const bookId = document.getElementById('updateBookId').value.trim();
    const title = document.getElementById('updateBookTitle').value.trim();
    const author = document.getElementById('updateBookAuthor').value.trim();
    const isbn = document.getElementById('updateBookIsbn').value.trim();

    if (!bookId || !title || !author || !isbn) {
        showMessage('请填写所有字段', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, author, isbn })
        });

        const data = await response.json();

        if (data.success) {
            showMessage(data.message, 'success');
            // 清空表单
            document.getElementById('updateBookId').value = '';
            document.getElementById('updateBookTitle').value = '';
            document.getElementById('updateBookAuthor').value = '';
            document.getElementById('updateBookIsbn').value = '';
            // 刷新图书列表
            loadBooks();
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('网络错误，请检查服务器连接', 'error');
    }
}

// ==================== 借阅管理功能 ====================

// 借阅图书
async function borrowBook() {
    const userName = document.getElementById('borrowUserName').value.trim();
    const bookId = document.getElementById('borrowBookId').value.trim();

    if (!userName || !bookId) {
        showMessage('请填写所有字段', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/borrow`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_name: userName, book_id: parseInt(bookId) })
        });

        const data = await response.json();

        if (data.success) {
            showMessage(data.message, 'success');
            // 清空表单
            document.getElementById('borrowUserName').value = '';
            document.getElementById('borrowBookId').value = '';
            // 刷新图书列表
            loadBooks();
            // 刷新借阅记录
            loadBorrowedBooks();
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('网络错误，请检查服务器连接', 'error');
    }
}

// 归还图书
async function returnBook() {
    const userName = document.getElementById('returnUserName').value.trim();
    const bookId = document.getElementById('returnBookId').value.trim();

    if (!userName || !bookId) {
        showMessage('请填写所有字段', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/return`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_name: userName, book_id: parseInt(bookId) })
        });

        const data = await response.json();

        if (data.success) {
            showMessage(data.message, 'success');
            // 清空表单
            document.getElementById('returnUserName').value = '';
            document.getElementById('returnBookId').value = '';
            // 刷新图书列表
            loadBooks();
            // 刷新借阅记录
            loadBorrowedBooks();
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('网络错误，请检查服务器连接', 'error');
    }
}

// 加载借阅记录
async function loadBorrowedBooks() {
    try {
        const response = await fetch(`${API_BASE_URL}/borrowed`);
        const data = await response.json();

        if (data.success) {
            renderBorrowedTable(data.borrowed_books);
        } else {
            showMessage('加载借阅记录失败', 'error');
        }
    } catch (error) {
        showMessage('网络错误，请检查服务器连接', 'error');
    }
}

// 渲染借阅记录表格
function renderBorrowedTable(borrowedBooks) {
    const tbody = document.getElementById('borrowedTableBody');
    tbody.innerHTML = '';

    if (borrowedBooks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">暂无借阅记录</td></tr>';
        return;
    }

    borrowedBooks.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.user_name}</td>
            <td>${record.book_title}</td>
            <td>${record.borrow_date}</td>
            <td>${record.return_date}</td>
            <td>${record.book_id}</td>
        `;
        tbody.appendChild(row);
    });
}

// ==================== 用户管理功能 ====================

// 用户注册
async function registerUser() {
    const name = document.getElementById('userName').value.trim();
    const password = document.getElementById('userPassword').value.trim();

    if (!name || !password) {
        showMessage('请填写所有字段', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, password })
        });

        const data = await response.json();

        if (data.success) {
            showMessage(data.message, 'success');
            // 清空表单
            document.getElementById('userName').value = '';
            document.getElementById('userPassword').value = '';
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('网络错误，请检查服务器连接', 'error');
    }
}

// ==================== 搜索查询功能 ====================

// 搜索图书
async function searchBooks() {
    const keyword = document.getElementById('searchKeyword').value.trim();

    if (!keyword) {
        showMessage('请输入搜索关键字', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/books/search?keyword=${encodeURIComponent(keyword)}`);
        const data = await response.json();

        if (data.success) {
            renderSearchResults(data.books);
        } else {
            showMessage('搜索失败', 'error');
        }
    } catch (error) {
        showMessage('网络错误，请检查服务器连接', 'error');
    }
}

// 按作者查询
async function searchByAuthor() {
    const author = document.getElementById('searchAuthor').value.trim();

    if (!author) {
        showMessage('请输入作者名称', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/books/author/${encodeURIComponent(author)}`);
        const data = await response.json();

        if (data.success) {
            renderSearchResults(data.books);
        } else {
            showMessage('查询失败', 'error');
        }
    } catch (error) {
        showMessage('网络错误，请检查服务器连接', 'error');
    }
}

// 渲染搜索结果
function renderSearchResults(books) {
    const tbody = document.getElementById('searchResultsBody');
    tbody.innerHTML = '';

    if (books.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">未找到相关书籍</td></tr>';
        return;
    }

    books.forEach(book => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${book.id}</td>
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.isbn}</td>
            <td class="${book.is_borrowed ? 'status-borrowed' : 'status-available'}">
                ${book.is_borrowed ? '已借出' : '可借阅'}
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ==================== 数据可视化功能 ====================

// 加载所有图表
async function loadAllCharts() {
    await loadBookStatusChart();
    await loadAuthorDistributionChart();
    await loadBorrowTrendChart();
    await loadSummaryCards();
}

// 刷新所有图表
function refreshAllCharts() {
    if (bookStatusChart) bookStatusChart.destroy();
    if (authorDistributionChart) authorDistributionChart.destroy();
    if (borrowTrendChart) borrowTrendChart.destroy();

    loadAllCharts();
}

// 加载图书状态统计图表
async function loadBookStatusChart() {
    try {
        const response = await fetch(`${API_BASE_URL}/statistics/book-status`);
        const data = await response.json();

        if (data.success) {
            const stats = data.statistics;
            renderBookStatusChart(stats);
        } else {
            showMessage('获取图书统计信息失败', 'error');
        }
    } catch (error) {
        showMessage('网络错误，请检查服务器连接', 'error');
    }
}

// 渲染图书状态图表
function renderBookStatusChart(stats) {
    const ctx = document.getElementById('bookStatusChart').getContext('2d');

    // 销毁现有图表
    if (bookStatusChart) {
        bookStatusChart.destroy();
    }

    bookStatusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['可借阅', '已借出'],
            datasets: [{
                data: [stats.available_books, stats.borrowed_books],
                backgroundColor: [
                    'rgba(40, 167, 69, 0.8)',
                    'rgba(220, 53, 69, 0.8)'
                ],
                borderColor: [
                    'rgb(40, 167, 69)',
                    'rgb(220, 53, 69)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    // 更新统计数据
    const statsHtml = `
        <div class="stat-item">
            <h4>总图书数</h4>
            <p>${stats.total_books}</p>
        </div>
        <div class="stat-item">
            <h4>已借出</h4>
            <p>${stats.borrowed_books}</p>
        </div>
        <div class="stat-item">
            <h4>可借阅</h4>
            <p>${stats.available_books}</p>
        </div>
        <div class="stat-item">
            <h4>借出率</h4>
            <p>${stats.total_books > 0 ? Math.round((stats.borrowed_books / stats.total_books) * 100) : 0}%</p>
        </div>
    `;
    document.getElementById('bookStatusStats').innerHTML = statsHtml;
}

// 加载作者分布图表
async function loadAuthorDistributionChart() {
    try {
        const response = await fetch(`${API_BASE_URL}/statistics/author-distribution`);
        const data = await response.json();

        if (data.success) {
            renderAuthorDistributionChart(data.distribution);
        } else {
            showMessage('获取作者分布信息失败', 'error');
        }
    } catch (error) {
        showMessage('网络错误，请检查服务器连接', 'error');
    }
}

// 渲染作者分布图表
function renderAuthorDistributionChart(distribution) {
    const ctx = document.getElementById('authorDistributionChart').getContext('2d');

    // 销毁现有图表
    if (authorDistributionChart) {
        authorDistributionChart.destroy();
    }

    const authors = distribution.map(item => item.author);
    const counts = distribution.map(item => item.book_count);

    authorDistributionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: authors,
            datasets: [{
                label: '图书数量',
                data: counts,
                backgroundColor: 'rgba(106, 17, 203, 0.6)',
                borderColor: 'rgba(106, 17, 203, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });

    // 更新作者统计
    const authorStatsHtml = distribution.map(item => `
        <div class="stat-item">
            <h4>${item.author}</h4>
            <p>${item.book_count} 本</p>
        </div>
    `).join('');
    document.getElementById('authorStats').innerHTML = authorStatsHtml;
}

// 加载借阅趋势图表
async function loadBorrowTrendChart() {
    try {
        const days = document.getElementById('trendPeriod').value;
        const response = await fetch(`${API_BASE_URL}/statistics/borrow-trend?days=${days}`);
        const data = await response.json();

        if (data.success) {
            renderBorrowTrendChart(data.trend, days);
        } else {
            showMessage('获取借阅趋势信息失败', 'error');
        }
    } catch (error) {
        showMessage('网络错误，请检查服务器连接', 'error');
    }
}

// 渲染借阅趋势图表
function renderBorrowTrendChart(trendData, days) {
    const ctx = document.getElementById('borrowTrendChart').getContext('2d');

    // 销毁现有图表
    if (borrowTrendChart) {
        borrowTrendChart.destroy();
    }

    const dates = trendData.map(item => {
        const date = new Date(item.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    const counts = trendData.map(item => item.count);

    borrowTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: '每日借阅量',
                data: counts,
                borderColor: 'rgba(0, 176, 155, 1)',
                backgroundColor: 'rgba(0, 176, 155, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// 加载摘要卡片
async function loadSummaryCards() {
    try {
        const response = await fetch(`${API_BASE_URL}/statistics/book-status`);
        const data = await response.json();

        if (data.success) {
            const stats = data.statistics;

            // 更新卡片数据
            document.getElementById('totalBooksCount').textContent = stats.total_books;
            document.getElementById('borrowedBooksCount').textContent = stats.borrowed_books;
            document.getElementById('availableBooksCount').textContent = stats.available_books;
            document.getElementById('totalUsersCount').textContent = stats.total_users;
        }
    } catch (error) {
        console.error('加载摘要卡片失败:', error);
    }
}
