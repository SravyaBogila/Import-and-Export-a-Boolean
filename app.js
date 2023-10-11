const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const snakeCaseToCameCaseForSpecificMovie = (dbObject) => {
  return {
    movieName: dbObject.movie_name,
  };
};

const snakeCaseToCamelCaseForMovie = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

const snakeCaseToCamelCaseForDirector = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};

const dbPath = path.join(__dirname, "moviesData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server is running at http://localhost/3001/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
};

initializeDBAndServer();

app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
        SELECT
            movie_name
        FROM
            movie
        ORDER BY
            movie_id;
    `;
  const moviesArray = await db.all(getMoviesQuery);

  response.send(
    moviesArray.map((eachMovie) => ({ movieName: eachMovie.movie_name }))
  );
});

app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const addMovieQuery = `
        INSERT INTO movie
            (director_id, movie_name, lead_actor)
        VALUES
            (${directorId}, "${movieName}", "${leadActor}");
    `;
  await db.run(addMovieQuery);
  response.send("Movie Successfully Added");
});

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
        SELECT
            *
        FROM
            movie
        WHERE
            movie_id = ${movieId};
    `;
  const movieArray = await db.get(getMovieQuery);
  const movieResult = snakeCaseToCamelCaseForMovie(movieArray);
  response.send(movieResult);
});

app.put("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const updateMovieQuery = `
        UPDATE 
            movie
        SET 
            director_id = ${directorId},
            movie_name = "${movieName}",
            lead_actor = "${leadActor}"
        WHERE
            movie_id = ${movieId};
    `;
  await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

app.delete("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
        DELETE
        FROM
            movie
        WHERE
            movie_id = ${movieId};
    `;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `
        SELECT 
            *
        FROM 
            director;
    `;
  const directorsArray = await db.all(getDirectorsQuery);
  const directorsResult = directorsArray.map((eachDirector) =>
    snakeCaseToCamelCaseForDirector(eachDirector)
  );
  response.send(directorsResult);
});

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getMoviesQuery = `
        SELECT 
            movie_name
        FROM
            movie INNER JOIN director
            ON movie.director_id = director.director_id
        WHERE
            movie.director_id = ${directorId};
    `;
  const moviesArray = await db.all(getMoviesQuery);
  response.send(
    moviesArray.map((eachObject) => ({ movieName: eachObject.movie_name }))
  );
});

module.exports = app;
