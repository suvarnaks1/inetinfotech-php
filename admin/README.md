# I-Net Infotech admin

Open `https://yourdomain/admin/` and sign in. Everything you save here is stored in the MySQL database and shows on the website straight away.

| Admin page | What it controls on the website |
|---|---|
| Courses | Courses page cards, each course's detail page, the course list in the Contact form. Add, edit, delete, Draft/Published, Featured |
| Placements | Placed-student dome (Placements page) and the faces strip on Home. Upload photos, edit name/company/role, hide, delete |
| Gallery | The moving picture wall on the Gallery page. Upload pictures, reorder, delete |
| Certifications | The "Our certifications" logo strip on Home. Add, edit, reorder, delete, Draft/Published |
| Home, About, Services, Contact | Saved in the database, but the public pages do not read them yet (see BACKEND-SETUP.md) |

Pictures you upload go to `/uploads` on the server. Pictures that ship with the site live in `/assets`.
