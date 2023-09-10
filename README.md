# api

To run this locally, you will need to install mysql:

```bash
sudo apt update
sudo apt install mysql-server
```

Now, start the server:

```bash
sudo service mysql start
```

If that doesn't work, try the answers to [this StackOverflow post](https://stackoverflow.com/questions/64883580/wsl-cant-connect-to-local-mysql-server-through-socket-var-run-mysqld-mysqld).

Then, you should be able to run the secure installation:

```bash
sudo mysql_secure_installation
```

Select Y and 0 to all of the questions.

---

Then, you will need to initialize the `tcn` user. Use `bash setup.sh` for this. If you are working in Windows natively, firstly, I would recommend you do not as `bun` does not have full support for Windows, but you should just run the database commands manually in that case.

(Using WSL with Windows is totally fine.)

---

Now, install all of the dependencies. If you don't have Bun installed on your system yet, do so:

```bash
curl -fsSL https://bun.sh/install | bash
```

Then, install all dependencies:

```bash
bun i
```

---

- For production simulation, run `bun start`.
- For development, run `bun dev`, which enables verbose logging and automatic reloading on file change (you will need to manually restart if you add new routes since they are dynamically imported and therefore new files won't be recognized by Bun).
- For testing, run `bun test-mode` to start up the server in test mode, which enables full logging and uses the test database.

To run tests, just do `bun run test` (do not use `bun test` as some tests will fail due to being in the wrong database).