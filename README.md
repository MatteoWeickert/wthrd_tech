# wthrd_tech

This README provides instructions on how to start, connect to, and stop the Docker container for the `wthrd_tech` project.

### 1: Clone the Repository
First, clone the `wthrd_tech` repository to your local machine and navigate to the backend branch:
```bash
git clone https://github.com/MatteoWeickert/wthrd_tech.git
```
Navigate to the project directory:
```bash
cd wthrd_tech/STAC_catalog
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

### 4: Access the Server

To access the server, open your web browser and navigate to:

```
http://localhost:8080
```

This will bring up the application interface where you can interact with the server.

### 5 (Optional): Connect to the Database Manually 

Run this command to connect to the database:

```bash
docker exec -it postgres-container psql -U admin -d metadata_database
```

Here you can run SQL queries like:

```bash
SELECT name FROM items;
```

Use:

```bash
\q
```

to quit the connection to the database.

### 6: Stopping the Container

When you are done and want to stop the Docker container, run:

```bash
docker-compose down
```

This will stop and remove the containers defined in your `docker-compose.yml` file.