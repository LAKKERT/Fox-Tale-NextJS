<p align="center"><img align="center" src="https://github.com/LAKKERT/Fox-Tale-NextJS/blob/main/public/header/logo.svg" /></p>
<h1 align="center">FOX TALE</h1>

## О проекте

<div>
  <p>Fox Tale это Сайт-портал для онлайн RPG игры, решающий ключевые задачи:</p>
    <ul>      
      <li>Лента последних новостей проекта</li>
      <li>Система тикетов для технической поддержки</li>
      <li>Интерактивная вики по игровому миру   </li> 
      </li>
    </ul>

  **Мотивация:**
  Проект создан для освоения Next.js
</div>

## Built With

* ![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
* ![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
* ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
* ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
* ![blender](https://img.shields.io/badge/blender-E87D0D?style=for-the-badge&logo=blender&logoColor=white)

## Getting Started

1. Склонируйте репозиторий:
    ```
    git clone https://github.com/LAKKERT/Fox-Tale-NextJS.git
    ```

2. Перейдите в директорию Fox-Tale-NextJS:
   ```sh
     cd Fox-Tale-NextJS
   ```

3. Установка зависимостей:
   ```sh
    npm i
   ```
4. Создайте базу данных под названием `foxtale` в pg4.

5. Создайте файл `.env` в корневой папке проекта, и заполните его данными
   ```sh
      PGSQL_HOST=localhost
      PGSQL_PORT=5432
      PGSQL_DATABASE=foxtale
      PGSQL_USERNAME=YOUR_USERNAME
      PGSQL_PASSWORD=YOUR_PASSWORD
      JWT_SECRET=YOUR_JWTSECRET
      
      SMTP_HOST=YOUR_HOST
      SMTP_PORT=YOUR_PORT
      SMTP_SECURE=true
      SMTP_USER='YOUR_SMTP_USER'
      SMTP_PASS='YOUR_SMTP_PASSWORD'
   ```
6. Инициализируйте базу данных::
   ```sh
     npm run seed
    ```

7. Запустите локальный сервер:
    ```sh
      npm run dev
    ```


8. Откройте [http://localhost:3000](http://localhost:3000) в вашем браузере.
