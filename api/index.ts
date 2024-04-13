const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cors = require('cors');
//const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("Express on Vercel fuuck"));

app.listen(3015, () => console.log("Server ready on port 3015."));
app.use(express.static('public'));

app.use(cors());
app.use(express.json());

// app.get('/', (req, res) => {
//     res.send('Hello, World!'); // Renvoyer 'Hello, World!' lorsque la route '/' est accédée
//   });
  
app.get('/hello', (req, res) => {
  res.send('Hello, World!'); // Renvoyer 'Hello, World!' lorsque la route '/' est accédée
});
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello, World!'); // Renvoyer 'Hello, World!' lorsque la route '/' est accédée
  });
  
  // Démarrage du serveur



// MONGOOSE

const mongoose = require('mongoose');





mongoose.connect(process.env.DB_URI)
    .then(() => console.log("Connexion à MongoDB réussie !"))
    .catch((err) => console.log("Connexion à MongoDB échouée !", err));

    const userSchema = new mongoose.Schema({
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        walletAddress: { type: String, unique: true, sparse: true }
    });



const feedSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: String, required: true },
    nftId: { type: String, required: true },
    offerId: { type: String, required: true },
    isSold: { type: Boolean, default: false }, // État de la vente
    creatorEmail: { type: String, required: true },  // Assurez-vous que cette ligne est correcte
    buyerEmail: { type: String, default: '' } // Ajouter ce champ pour enregistrer l'email de l'acheteur
});
  
const Feed = mongoose.model('Feed', feedSchema);
module.exports = Feed;
const User = mongoose.model('User', userSchema);
module.exports = User;




app.get('/users', async (req, res) => {
  // Ici, ajoutez une vérification de l'authentification et des autorisations
  try {
      const users = await User.find({}); // Renvoie tous les utilisateurs
      res.json(users);
  } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des utilisateurs." });
  }
});



// Simulez une base de données en mémoire
const users = [];

app.post('/firstco', (req, res) => {
    // Récupérer les données de la requête
    const username = req.body.username;
    console.log("Nom d'utilisateur : ", username);

    // Logique de traitement - à implémenter
    // Par exemple, vérification des informations d'identification, enregistrement dans la base de données, etc.

    // Réponse réussie
    res.status(200).json({ message: "Bonjour " + username });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
    console.log("try login email = ", email);
  try {
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ message: "Mot de passe incorrect" });

      // Générer un token JWT contenant l'ID de l'utilisateur
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      
      res.json({ message: "Connexion réussie", token });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lors de la connexion de l'utilisateur" });
  }
  console.log("end login email = ", email);
});

app.post('/register', async (req, res) => {
    const { email, password, walletAddress } = req.body;
    console.log("try register email = ", email);
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà.' });
        }
  
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, password: hashedPassword, walletAddress });
        await newUser.save();
  
        res.status(201).json({ message: 'Utilisateur enregistré avec succès.' });
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ message: "L'adresse de portefeuille est déjà utilisée par un autre compte ou ne peut être vide." });
        } else {
            console.error(error);
            res.status(500).json({ message: "Erreur lors de la création de l'utilisateur." });
        }
    }
  });

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    if (!token) return res.status(401).json({ message: "Accès refusé, token non fourni" });
  
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: "Token invalide" });
        req.userId = decoded.id; // Assurez-vous que votre payload de token contient un champ 'id'
        next();
    });
  };

  app.post('/feed', async (req, res) => {
    const { name, description, price, nftId, offerId, creatorEmail,  isSold} = req.body;
    try {
        const product = new Feed({ name, description, price, nftId, offerId, creatorEmail, isSold});
        await product.save();
        res.status(201).json({ message: 'Product added successfully', product });
    } catch (error) {
        console.error('Failed to add product:', error);
        res.status(500).json({ message: 'Failed to add product', error });
    }
});

  app.get('/feeds', async (req, res) => {
    try {
      // Utiliser la condition { isSold: false } pour récupérer seulement les feeds non vendus
      const feeds = await Feed.find({ isSold: false });
      res.status(200).json(feeds);
    } catch (error) {
      console.error('Failed to retrieve available feeds:', error);
      res.status(500).json({ message: 'Failed to retrieve available feeds', error });
    }
});

app.post('/buy-feed/:feedId', async (req, res) => {
    const { feedId } = req.params;
    const buyerEmail = req.body.buyerEmail; // Assurez-vous que le frontend envoie l'email de l'acheteur

    try {
        // Trouver le feed et vérifier s'il a déjà été acheté
        const feed = await Feed.findById(feedId);
        if (!feed) {
            return res.status(404).json({ message: 'Feed not found' });
        }
        if (feed.buyerEmail) {
            return res.status(400).json({ message: 'This offer has already been purchased' });
        }

        // Marquer le feed comme vendu et enregistrer l'acheteur
        feed.buyerEmail = buyerEmail;
        feed.isSold = true; // Assurez-vous que votre schéma Feed a un champ isSold
        await feed.save();

        res.json({ message: 'Offer purchased and marked as sold successfully', feed });
    } catch (error) {
        console.error('Failed to process the purchase:', error);
        res.status(500).json({ message: 'Failed to process the purchase', error });
    }
});

app.get('/user-purchases', async (req, res) => {
    const { email } = req.query; // Récupérer l'email depuis la chaîne de requête
    try {
        if (!email) {
            return res.status(400).json({ message: "Email parameter is required." });
        }
        
        const purchases = await Feed.find({ buyerEmail: email });
        res.json(purchases);
    } catch (error) {
        console.error('Error fetching user purchases:', error);
        res.status(500).json({ message: 'Error fetching user purchases', error });
    }
});

app.get('/user-feeds', async (req, res) => {
    const { email } = req.query; // Récupérer l'email depuis la chaîne de requête

    if (!email) {
        return res.status(400).json({ message: "Email parameter is required." });
    }

    try {
        const feeds = await Feed.find({ creatorEmail: email });
        res.json(feeds.map(feed => ({
            id: feed._id,
            name: feed.name,
            description: feed.description,
            price: feed.price,
            isSold: feed.isSold
        })));
    } catch (error) {
        console.error('Error fetching user feeds:', error);
        res.status(500).json({ message: 'Error fetching user feeds', error });
    }
});

app.get('/users', async (req, res) => {
  try {
      const users = await User.find({});
      res.json(users);
  } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des utilisateurs." });
  }
});



app.post('/updateProfile', verifyToken, async (req, res) => {
  const { walletAddress } = req.body;

  try {
      // Mise à jour de l'utilisateur avec l'ID extrait du token JWT
      const updatedUser = await User.findByIdAndUpdate(req.userId, { walletAddress }, { new: true });

      if (!updatedUser) {
          return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      res.json({ message: "Profil mis à jour avec succès", walletAddress: updatedUser.walletAddress });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lors de la mise à jour du profil" });
  }
});

app.get('/profile', verifyToken, async (req, res) => {
    try {
        // Utilisez req.userId défini par le middleware verifyToken pour trouver l'utilisateur
        const user = await User.findById(req.userId).select('-password'); // Exclure le mot de passe des résultats

        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        res.json({ email: user.email, walletAddress: user.walletAddress || 'Non définie' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la récupération des informations de l'utilisateur" });
    }
});

app.get('/profile', verifyToken, async (req, res) => {
  try {
      // Utilisez req.userId défini par le middleware verifyToken pour trouver l'utilisateur
      const user = await User.findById(req.userId).select('-password'); // Exclure le mot de passe des résultats

      if (!user) {
          return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      res.json({ email: user.email, walletAddress: user.walletAddress || 'Non définie' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lors de la récupération des informations de l'utilisateur" });
  }
});



app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



module.exports = app;