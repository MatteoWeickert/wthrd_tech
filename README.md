# Introduction

This repository is the result of the wthrd_tech() team for the project "Web Catalogue for User-Friendly Search and Retrieval of Machine Learning Models for EO Datacubes", developed as part of the Geosoftware II module in the Winter semester 2024/2025.

The following sections explain how to set up and run the project.

### 1: Clone the Repository
First, clone the `wthrd_tech` repository to your local machine and navigate to the main branch:
```bash
git clone https://github.com/MatteoWeickert/wthrd_tech.git
```
Navigate to the project directory:
```bash
cd wthrd_tech
```

### 2: Set Up the .env File 
Create a .env file in the root of the project directory to store environment variables. The .env file should include the database connection details and any other sensitive configuration. Here's an example:
```makefile
POSTGRES_USER=admin
POSTGRES_PASSWORD=enterYourPasswordHere
POSTGRES_DB=metadata_database
```

### 3: Start the Container

In your project directory, run:

```bash
docker-compose up -d --build
```

### 4: Access the Webcatalog:

To access the Webkatalog, open your web browser and navigate to:

```
http://localhost:8082
```

This will bring up the Welcome-page of the Webcatalog where you receive further information on how to use the catalog.

### 5 (Optional): Connect to the Database via Adminer

Adminer is a lightweight database management tool that allows you to interact directly with the PostgreSQL database. To access Adminer, open your browser and navigate to:

```
http://localhost:8081
```

Once there, enter the following credentials:

    System: PostgreSQL
    Server: database (or localhost if accessing directly)
    Username: admin (as defined in your .env file)
    Password: The password you set in the .env file
    Database: metadata_database

After logging in, you can explore the database, run SQL queries, and manage tables directly through the Adminer interface.


### 6: Stopping the Container

When you are done and want to stop the Docker container, run:

```bash
docker-compose down
```

This will stop and remove the containers defined in your `docker-compose.yml` file.