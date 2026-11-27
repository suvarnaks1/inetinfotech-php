# PHP backend setup (I-Net Infotech)

The design (HTML/CSS) is unchanged. A small PHP + MySQL backend was added so the admin panel really saves and the website shows the saved data.

## 1. Requirements
PHP 7.4 or newer (8.x is fine) with PDO MySQL, and one MySQL/MariaDB database. Any normal shared hosting (cPanel, Hostinger, etc.) has both. On Apache the `.htaccess` files in `api/` and `uploads/` work as they are; on Nginx ask the host to block PHP execution inside `uploads/`.

## 2. Install (about 5 minutes)
1. Create a MySQL database + user in your hosting panel.
2. Edit **`api/config.php`**: DB_HOST, DB_NAME, DB_USER, DB_PASS, and **change ADMIN_USER / ADMIN_PASS**.
3. Upload the whole folder to your hosting (public_html). Make sure `uploads/` is writable (permission 755, or 775 if uploads fail).
4. Open `https://yourdomain/api/install.php` once. It should say "table site_content is ready". Then **delete `api/install.php`**.
   (Alternative: import `schema.sql` in phpMyAdmin.)
5. Open `https://yourdomain/admin/` and sign in.

## 3. How it works
- `api/boot.php` prints the saved data as `window.INET_DATA`; every page loads it with one `<script>` tag. Nothing saved yet = the pages show their original built-in content, so the site looks the same until you edit something.
- `api/save.php` stores one block of content (courses, students, gallery, certs ...) in the table `site_content` as JSON. `api/upload.php` stores images in `uploads/` (JPG, PNG, GIF, WEBP, max 8 MB, content-checked).
- `api/login.php` / `logout.php`: session login. Every write needs the login session and a CSRF token. Visitors never receive Draft courses/logos or hidden students.
- `js/site-data.js` fills the Gallery wall, the Placements dome, the Home faces strip and the Home logo strip from that data.

## 4. First edit
The admin shows the original courses/photos/logos the first time. They become database content the first time you press Save on that page.

## 5. Known limits
- Home, About, Services and Contact page texts, and the "How it works" text on Courses, are saved by the admin but the public pages do not read them yet.
- Deleting a photo removes it from the website but does not delete the file from `uploads/`.
- Two admins editing the same page at the same time: the last Save wins.
