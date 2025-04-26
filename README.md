<p align="center"><img align="center" src="https://github.com/LAKKERT/Fox-Tale-NextJS/blob/main/public/header/logo.svg" /></p>
<h1 align="center">FOX TALE</h1>

## Содержание
- [О проекте](#о-проекте)
- [Технологии](#технологии)
- [Структура проекта](#структура-проекта)
- [Начало работы](#начало-работы)
- [Использование](#использование)

## О проекте

<div>

  <div align="center">
      <img align="center" width="45%" src="https://github.com/LAKKERT/Fox-Tale-NextJS/blob/main/public/preview/preScreen.png" />
      <img align="center" width="45%" src="https://github.com/LAKKERT/Fox-Tale-NextJS/blob/main/public/preview/preScreen2.png" />
  </div>
  
  <p>Fox Tale это Сайт-портал для онлайн RPG игры, решающий ключевые задачи:</p>
    <ul>      
      <li>Лента последних новостей проекта</li>
      <li>Система тикетов для технической поддержки</li>
      <li>Интерактивная вики по игровому миру</li> 
      </li>
    </ul>

  **Мотивация:**
  Проект создан для освоения Next.js
</div>

## Технологии

* ![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
* ![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
* ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
* ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
* ![blender](https://img.shields.io/badge/blender-E87D0D?style=for-the-badge&logo=blender&logoColor=white)

## Структура проекта
```
  Fox_Tale/
  ├── public                  # Ассеты (изображения, статические файлы)
  ├── src
  │   └── app                 # Все страницы и логика Next.js
  ├── db                      # Подключение к базе данных и модели данных
  ├── helpers                 # Вспомогательные функции и скрипты
  ├── lib                     # Типизация и утилиты
  ├── pages
  │   └── api                 # API-роуты для обработки запросов
  ├── stores                  # Локальное хранилище
```
## Начало работы

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

## Использование

При желании вы можете авторизоваться как администратор, используя логин `ADMIN` и пароль `123456`. Это предоставит расширенные привилегии:

* Добавление нового контента
* Редактирование существующего контента
* Удаление материалов
