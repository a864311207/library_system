from flask import Flask, jsonify, request
from flask_cors import CORS
from library_api import LibraryAPI
import traceback

app = Flask(__name__)
CORS(app)  # 允许跨域请求
api = LibraryAPI()


# 错误处理
@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'message': 'API endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'message': 'Internal server error'}), 500


# 用户管理
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        name = data.get('name')
        password = data.get('password')

        success, message = api.register_user(name, password)
        return jsonify({'success': success, 'message': message})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


# 书籍管理
@app.route('/api/books', methods=['GET', 'POST'])
def books():
    if request.method == 'GET':
        # 获取所有书籍
        books_list = api.list_books()
        return jsonify({'success': True, 'books': books_list})

    elif request.method == 'POST':
        # 添加新书
        data = request.get_json()
        title = data.get('title')
        author = data.get('author')
        isbn = data.get('isbn')

        success, message = api.add_book(title, author, isbn)
        return jsonify({'success': success, 'message': message})


@app.route('/api/books/<int:book_id>', methods=['DELETE', 'PUT'])
def book_operations(book_id):
    if request.method == 'DELETE':
        # 删除书籍
        success, message = api.remove_book(book_id)
        return jsonify({'success': success, 'message': message})

    elif request.method == 'PUT':
        # 更新书籍信息
        data = request.get_json()
        title = data.get('title')
        author = data.get('author')
        isbn = data.get('isbn')

        success, message = api.update_book(book_id, title, author, isbn)
        return jsonify({'success': success, 'message': message})


@app.route('/api/books/search', methods=['GET'])
def search_books():
    keyword = request.args.get('keyword')
    books = api.search_book(keyword)
    return jsonify({'success': True, 'books': books})


@app.route('/api/books/author/<author>', methods=['GET'])
def search_by_author(author):
    books = api.search_books_by_author(author)
    return jsonify({'success': True, 'books': books})


# 借阅管理
@app.route('/api/borrow', methods=['POST'])
def borrow():
    data = request.get_json()
    user_name = data.get('user_name')
    book_id = data.get('book_id')

    success, message = api.borrow_book(user_name, book_id)
    return jsonify({'success': success, 'message': message})


@app.route('/api/return', methods=['POST'])
def return_book():
    data = request.get_json()
    user_name = data.get('user_name')
    book_id = data.get('book_id')

    success, message = api.return_book(user_name, book_id)
    return jsonify({'success': success, 'message': message})


@app.route('/api/borrowed', methods=['GET'])
def borrowed_books():
    borrowed_list = api.view_borrowed_books()
    return jsonify({'success': True, 'borrowed_books': borrowed_list})


# 数据可视化API
@app.route('/api/statistics/book-status', methods=['GET'])
def get_book_statistics():
    try:
        stats = api.get_book_statistics()
        if stats:
            return jsonify({'success': True, 'statistics': stats})
        else:
            return jsonify({'success': False, 'message': '获取统计数据失败'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/statistics/author-distribution', methods=['GET'])
def get_author_distribution():
    try:
        distribution = api.get_author_distribution()
        return jsonify({'success': True, 'distribution': distribution})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/statistics/borrow-trend', methods=['GET'])
def get_borrow_trend():
    try:
        days = request.args.get('days', 30, type=int)
        trend = api.get_borrow_trend(days)
        return jsonify({'success': True, 'trend': trend})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


# 健康检查
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
