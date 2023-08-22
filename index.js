
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const jdb = require("simple-json-db");
const app = express();
const path = require("path");

const db = new jdb("./db.json");

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "views")));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = app.listen(3500, () => {
    console.log("Server ready: 3500");
});

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
});

app.get("/admin", (req, res) => {
    const username = "admin"; // Ganti dengan username admin yang valid
    if (isAdmin(username)) {
        const unconfirmedUsers = getUnconfirmedUsers();
        res.render("admin", { unconfirmedUsers });
    } else {
        res.redirect("/");
    }
});

app.post("/admin/confirm", (req, res) => {
    const { username } = req.body;
    // Lakukan logika untuk mengkonfirmasi pengguna
    // Misalnya, Anda dapat mengubah properti "confirmed" menjadi true pada objek pengguna di database
    // Setelah itu, Anda dapat mengarahkan kembali ke halaman admin
    res.redirect("/admin");
});

app.post("/u/new", async (req, res) => {
    try {
        const username = req.body.usr;
        const password = req.body.password;
        const referralCode = req.body.referral || "";

        // Save the new account to the database
        db.set(username, { password: password, referralCode, confirmed: false });

        // Check if the user already has a balance in balances.json
        const balances = JSON.parse(fs.readFileSync("database/balances.json"));
        if (!(username in balances)) {
            balances[username] = 10000; // Set saldo awal menjadi 10.000
            fs.writeFileSync("database/balances.json", JSON.stringify(balances, null, 2));
        }

        // Show success popup
        res.send(`<script>
            alert('Registration Successful! Your account has been created successfully!');
            window.location.href = '/';
        </script>`);
    } catch (err) {
        res.status(500).send("Woah, We have a problem! <br><br>" + err);
    }
});

app.get("/me/login", (req, res) => {
    res.sendFile(__dirname + "/views/login.html");
});

app.post("/me/login", async (req, res) => {
    const username = req.body.user;
    const password = req.body.pwd;

    if (db.has(username)) {
        const user = db.get(username);

        if (password === user.password) {
            const saldo = getSaldo(username);
            const userObj = {
                username: username,
                saldo: saldo,
                rekamanList: rekamanList,
                isAdmin: user.isAdmin
            };

            if (user.isAdmin) {
                res.redirect("/admin"); // Arahkan ke halaman admin jika user adalah admin
            } else {
                res.render("dashboard", { user: userObj });
            }
        } else {
            res.send(`<script>
                alert('Login Failed. Incorrect password.');
                window.location.href = '/me/login';
            </script>`);
        }
    } else {
        res.send(`<script>
            alert('Login Failed. User does not exist.');
            window.location.href = '/me/login';
        </script>`);
    }
});

app.get("/shop", (req, res) => {
    const username = "John Doe"; // Ganti dengan username yang sesuai setelah login
    const saldo = getSaldo(username);
    res.render("shop", {
        username: username,
        saldo: saldo,
        rekamanList: rekamanList,
    });
});

function isAdmin(username) {
    const user = db.get(username);
    return user && user.isAdmin === true;
}

function getUnconfirmedUsers() {
    const users = db.JSON();
    return Object.keys(users).filter(username => !users[username].confirmed);
}

function getSaldo(username) {
    try {
        const balances = JSON.parse(fs.readFileSync("database/balances.json"));
        return balances[username] || 0;
    } catch (error) {
        console.error("Error reading balances file:", error);
        return 0;
    }
}

const rekamanList = [
    { name: "Pemasukan 1", time: "2023-08-06 12:07:53", amount: "50000.00" },
    { name: "Pengeluaran 1", time: "2023-08-06 13:15:30", amount: "-15000.00" },
    // Tambahkan data riwayat lainnya jika diperlukan
];
  