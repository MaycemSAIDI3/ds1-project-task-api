const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// El schema hedha yfassar el donnees mta3 kol user.
const userSchema = new mongoose.Schema({
  // El nom obligatoire bech na3rfou chkoun el user.
  name: {
    type: String,
    required: [true, 'Name is required.'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters.'],
  },

  // El login houwa elli bech nesta3mlouh fel connexion.
  // lowercase ywalli el lettres sghar bech nafs el login
  // ma yet3awedch b lettres kbar w lettres sghar.
  // unique ya3mel index fel MongoDB bech yemna3 el doublons.
  login: {
    type: String,
    required: [true, 'Login is required.'],
    trim: true,
    lowercase: true,
    minlength: [3, 'Login must contain at least 3 characters.'],
    maxlength: [50, 'Login cannot exceed 50 characters.'],
    unique: true,
  },

  // El password obligatoire w lezem fih au moins 8 caracteres.
  // Ma nesta3mlouch trim khater el espaces ynajmou ykounou
  // partie mel password elli e5tarou el user.
  // select: false yna77ih mel resultats mta3 el lecture par defaut.
  password: {
    type: String,
    required: [true, 'Password is required.'],
    minlength: [8, 'Password must contain at least 8 characters.'],
    select: false,
    validate: {
      // bcrypt ye5dem 3la maximum 72 bytes.
      // Na7sbou el bytes khater moch kol caractere ya5ou byte wa7da.
      validator: function (value) {
        return Buffer.byteLength(value, 'utf8') <= 72;
      },
      message: 'Password cannot exceed 72 UTF-8 bytes.',
    },
  },

  // El role par defaut user.
  // Fel inscription el controller bech yofrodh user.
  // Ma nkhalliwch chkoun ya3ti lrou7ou role manager mel requete.
  role: {
    type: String,
    enum: {
      values: ['user', 'manager'],
      message: 'Role must be user or manager.',
    },
    default: 'user',
  },

  // El date tet7at automatiquement wa9t creation mta3 el user.
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
});

// El fonction hedhi tet3ayet 9bal save w zeda m3a create.
// Nesta3mlou function 3adiya bech this yarja3 lel user hedha.
// Ken el password ma tbaddelch, ma n3awdouch na3mloulou hash.
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) {
    return;
  }

  // bcrypt ya3mel salt automatiquement w ya7seb el hash.
  // 12 houwa el cost: y7added 9addech el calcul ykoun the9il.
  this.password = await bcrypt.hash(this.password, 12);
});

// Fel login bech na9raw el password b select('+password').
// El fonction hedhi t9aren el password el med5oul bel hash.
// Tarja3 true ken yetwef9ou, sinon false.
userSchema.methods.comparePassword = async function (candidatePassword) {
  // Narfedhou valeur moch texte wala password yfout 72 bytes.
  // Hakka ma nkhalliwch bcrypt ya9ta3 el password bla ma na3rfou.
  if (
    typeof candidatePassword !== 'string' ||
    Buffer.byteLength(candidatePassword, 'utf8') > 72
  ) {
    return false;
  }

  return bcrypt.compare(candidatePassword, this.password);
};

// Ki n7awlou el user l JSON, nna77iw el password.
// Hakka 7atta el hash ma yokhrejch fel reponse mta3 el API.
userSchema.set('toJSON', {
  transform: function (_document, result) {
    delete result.password;
    return result;
  },
});

// Nsaddrou el model bech nesta3mlouh fel inscription w el login.
module.exports = mongoose.model('User', userSchema);
