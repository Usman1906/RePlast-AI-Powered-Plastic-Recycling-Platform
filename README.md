# RePlast — React + Spring Boot + MySQL

RePlast is a plastic-recycling and eco-shop platform. This project uses React/Vite for the frontend and **Spring Boot + MySQL** for the backend. Postman requests are included for API testing.

## Technology stack

- Frontend: React, Vite, React Router, JavaScript, CSS
- Backend: Java 17+, Spring Boot 3.4, Spring Web, Spring JDBC
- Database: MySQL 8+
- Authentication: BCrypt password hashing + signed JWT bearer tokens
- Product image uploads: Spring multipart upload, stored under `backend-spring/uploads/`
- API testing: `postman/RePlast_Spring_MySQL.postman_collection.json`

## 1. Prerequisites

Install:

1. Java JDK 17 or newer
2. Apache Maven 3.9+
3. MySQL 8+
4. Node.js 20.19+ (or 22.12+) and npm
5. Postman (for API testing)

## 2. Configure MySQL

Create the database in MySQL Workbench or the MySQL shell:

```sql
CREATE DATABASE replast CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

The application also uses `createDatabaseIfNotExist=true`, but create the database manually if your MySQL account does not have database-creation privileges.

The schema is in `backend-spring/src/main/resources/schema.sql` and is initialized automatically when the Spring application starts. Tables include users, products, pickups, schedules, notifications, orders, order_items and reward_transactions.

## 3. Start the Spring Boot API

Open a terminal in the `replast` project folder. Configure environment variables in PowerShell (replace the sample MySQL password):

```powershell
$env:DB_URL="jdbc:mysql://localhost:3306/replast?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
$env:DB_USERNAME="root"
$env:DB_PASSWORD="YOUR_MYSQL_PASSWORD"
$env:JWT_SECRET="replace-this-with-a-long-random-secret-of-at-least-32-characters"
$env:ADMIN_EMAIL="admin@123"
$env:ADMIN_PASSWORD="change-this-admin-password"
$env:CLIENT_ORIGIN="http://localhost:5173"
cd backend-spring
mvn spring-boot:run
```

The API starts at `http://localhost:8080`. Check `http://localhost:8080/api/health` for the health response. Uploaded images are saved to `backend-spring/uploads/` and served under `/uploads/...`.

**Security:** Set a unique JWT secret and strong admin password before any public deployment. Do not commit `.env` files or database credentials. The supplied admin defaults are for local development only.

## 4. Start the React frontend

Open a second terminal at the project root (`replast`):

```bash
npm install
npm run dev
```

The frontend defaults to `http://localhost:8080/api`. To change it, create a root `.env` file from `.env.example` and set `VITE_API_URL`.

## 5. Admin capabilities

After signing in with the configured admin account, the admin can:

- View registered users, deactivate/reactivate accounts, adjust reward points, and delete users.
- Review all recycling pickup requests and AI scan results; approve only after the saved scan result is `plastic`.
- Reject requests, assign available dates/time slots, schedule collections, and update pickup status.
- View schedules and reward transaction history.
- Add new shop products with images, prices, descriptions, categories and stock quantity.
- Edit product information, replace product images, mark items in stock/low stock/out of stock, change visibility, and archive products. Archiving preserves historical order item names/prices.
- View all product records, including archived products, from the admin product management page.

Product stock is checked again on the server during checkout; unavailable products cannot be purchased. When orders complete, stock is reduced and products with zero quantity are marked out of stock.

## 6. Test with Postman

1. Open Postman and choose **Import**.
2. Import `postman/RePlast_Spring_MySQL.postman_collection.json`.
3. Start Spring Boot first.
4. Run **Login (admin)** with the collection variables `adminEmail` and `adminPassword` matching the environment variables used to start the API.
5. Copy the returned `token` value into the collection's `token` variable (or use Postman's response script to automate it).
6. Test the admin products endpoints. For create/update product image requests, select a local image file for the `image` form-data field.
7. Use real IDs from responses instead of the sample ID `1` in workflow requests.

The collection includes health, signup/login, bootstrap, pickup lifecycle, AI result storage, schedules, reward history, user administration, product CRUD/image uploads/stock status, and reward-points checkout.

## 7. Important implementation notes

- TensorFlow.js + MobileNet image inference remains in the admin browser. The API stores the submitted result and enforces that the saved classification is `plastic` before approving. For production, inference should be independently verified server-side because a browser result can be manipulated by a client.
- Eco Shop checkout currently uses reward points as the payment method; it is not a real UPI/card payment gateway.
- Local uploads persist on the machine running Spring Boot. For cloud deployment, use persistent storage or an object-storage service and configure MySQL as a managed database.
- Do not use SQLite or the legacy Node API. The supported backend in this version is `backend-spring`.
