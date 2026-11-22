-- Las salas privadas dejan de tener contraseña: se entra con el código.
ALTER TABLE "room" DROP COLUMN "password_hash";
