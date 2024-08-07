from flask import render_template,  current_app, redirect, url_for, flash, request
from urllib.parse import urlparse
from flask_login import login_user, logout_user, current_user, UserMixin
from app import login
from app.auth import bp
from app.auth.forms import LoginForm
from app.models import Alert, Station, Unit

class FakeUser(UserMixin):
    id = 1
    username = "Admin User"
    password = ""

@login.user_loader
def load_user(id):
    fakeuser = FakeUser()
    return fakeuser

@bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('admin.admin'))
    form = LoginForm()
    if form.validate_on_submit():
        if form.username.data != current_app.config['ADMIN_USERNAME'] or form.password.data != current_app.config['ADMIN_PASSWORD']:
            flash('Invalid username or password')
            return redirect(url_for('auth.login'))
        user = FakeUser()
        user.username = form.username.data
        user.password = form.password.data
        # user.user_id = 1;
        login_user(user, remember=form.remember_me.data)
        next_page = request.args.get('next')
        if not next_page or urlparse(next_page).netloc != '':
            next_page = url_for('admin.admin')
        return redirect(next_page)
    stations = Station.query.order_by(Station.name.asc()).all()
    return render_template('auth/login.html', title=('Sign In'), stations=stations, form=form)


@bp.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('auth.login'))