# FertiScan Frontend

([*Le français est disponible au bas de la page*](#fertiscan-frontend-fr))

This project is a **Next.js v14.2.15** application using **TypeScript**,
**Material UI**, **Zustand** for state management, and **Jest** with **React
Testing Library** for unit testing.

## Table of Contents

- [Getting Started](#getting-started)
- [Folder Structure](#folder-structure)
- [Running the Project](#running-the-project)
- [Testing](#testing)
- [Theming](#theming)
- [State Management](#state-management)
- [Contribution Guidelines](#contribution-guidelines)

## Getting Started

### Prerequisites

Make sure you have the following installed on your machine:

- Node.js (v14 or later)
- npm (or yarn)

### Installation

1. Clone the repository:

   `git clone https://github.com/your-username/your-repo.git`

2. Navigate to the project directory:

   `cd your-repo`

3. Install the dependencies:

   `npm install`

4. Copy the `.env.template`:

   `cp .env.template .env`

5. Start the development server:

   `npm run dev`

The application should now be running at `http://localhost:3000`.

## Folder Structure

This project follows a modular file structure based on Next.js v14's `src/app`
directory layout. Here's an overview:

```bash
src/
├── app/
│   ├── some-page/
│   │   ├── page.tsx       # Corresponds to the URL /some-page
│   │   └── __tests__/
│   │       └── some-page.test.tsx
│   ├── layout.tsx         # Main layout for the application
│   ├── theme.ts           # Material UI theme configuration
│   └── page.tsx           # Homepage (URL: /)
│
├── Components/
│   ├── __tests__/
│   │   └── Header.test.tsx # Unit tests for the Header component
│   └── Header.tsx          # Header component
│
└── store/
    └── useStore.ts         # Zustand store for state management
```

## Running the Project

To start the development server:

`npm run dev`

This will launch the application at `http://localhost:3000`.

To build the application for production:

`npm run build`

To start the production build:

`npm run start`

## Testing

We use **Jest** and **React Testing Library** to test components and application
logic.

### Running Tests

To run all tests:

npm run test

Tests are located in the `__tests__` directories adjacent to the components or
pages they test.

## Theming

This project uses **Material UI** for theming. The theme is configured in the
`src/app/theme.ts` file.

To apply the theme globally in your application, you can use the `ThemeProvider`
component provided by Material UI in your `src/app/layout.tsx` file.

### Applying the Theme

In your `layout.tsx`:

```typescript
// src/app/layout.tsx
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme'; // Import your custom theme

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* This resets browser default styling */}
      {children}
    </ThemeProvider>
  );
}
```

### Using the Theme in Components

You can access the theme inside any component using Material UI’s `useTheme`
hook or by applying the theme values directly through the MUI components.

Example using `useTheme`:

```typescript
// src/Components/Header.tsx
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

const Header = () => {
  const theme = useTheme();

  return (
    <header style={{ backgroundColor: theme.palette.primary.main, padding: '1rem' }}>
      <Typography variant="h4" color="secondary">
        Welcome to the Application
      </Typography>
    </header>
  );
};

export default Header;
```

In this example, the `Header` component uses the primary color from the theme
for the background and the secondary color for the text. You can access any part
of the theme (e.g., spacing, typography) in a similar way with `useTheme`.

---

## State Management

We use **Zustand** for lightweight state management. The store is located in the
`src/store/useStore.ts` file.

Example store setup:

```typescript
// src/store/useStore.ts
import create from "zustand";

interface StoreState {
  counter: number;
  increment: () => void;
}

const useStore = create<StoreState>((set) => ({
  counter: 0,
  increment: () => set((state) => ({ counter: state.counter + 1 })),
}));

export default useStore;
```

## Contribution Guidelines

We encourage all contributors to follow the guidelines outlined in our
[CONTRIBUTING.md](https://github.com/ai-cfia/.github/blob/main/profile/CONTRIBUTING.md)
document.

### Forking and Cloning

1. Fork the repository by clicking on the 'Fork' button on the top-right of the
   repository page.
2. Clone the forked repository to your local machine:

   ```bash
   git clone https://github.com/your-username/your-repo.git
   ```

### Working on an Issue

1. Always create a new branch for the feature or bugfix you're working on:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes, ensuring they adhere to the
   [CONTRIBUTING.md](https://github.com/ai-cfia/.github/blob/main/profile/CONTRIBUTING.md)
   guidelines.
3. Run the test suite to verify:

   ```bash
   npm run test
   ```

4. Once your changes are complete, commit and push them to your fork:

   ```bash
   git add .
   git commit -m "Description of your feature/bugfix"
   git push origin feature/your-feature-name
   ```

5. Open a Pull Request (PR) from your feature branch, providing a clear
   description of the changes.

### Code Style

- Follow the ESLint and Prettier configurations provided.
- Write unit tests for your code.
- Ensure the app runs without errors before submitting.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file
for details.

---

## FertiScan Frontend (FR)

Ce projet est une application **Next.js v14.2.15** utilisant **TypeScript**,
**Material UI**, **Zustand** pour la gestion d'état, ainsi que **Jest** et
**React Testing Library** pour les tests unitaires.

## Table des matières

- [Commencer](#commencer)
- [Structure des dossiers](#structure-des-dossiers)
- [Exécution du projet](#exécution-du-projet)
- [Tests](#tests)
- [Thématisation](#thématisation)
- [Gestion d'état](#gestion-détat)
- [Guide de contribution](#guide-de-contribution)

## Commencer

### Prérequis

Assurez-vous que les éléments suivants sont installés sur votre machine :

- Node.js (v14 ou plus)
- npm (ou yarn)

### Faire l'installation

1. Clonez le dépôt :

   `git clone https://github.com/your-username/your-repo.git`

2. Accédez au répertoire du projet :

   `cd your-repo`

3. Installez les dépendances :

   `npm install`

4. Copiez le fichier `.env.template`:

   `cp .env.template .env`

5. Lancez le serveur de développement :

   `npm run dev`

L'application devrait maintenant fonctionner sur `http://localhost:3000`.

## Structure des dossiers

Ce projet suit une structure de fichiers modulaires basée sur la mise en page du
répertoire `src/app` de Next.js v14. Voici une vue d'ensemble :

```bash
src/
├── app/
│   ├── some-page/
│   │   ├── page.tsx       # Correspond à l'URL /some-page
│   │   └── __tests__/
│   │       └── some-page.test.tsx
│   ├── layout.tsx         # Mise en page principale de l'application
│   ├── theme.ts           # Configuration du thème Material UI
│   └── page.tsx           # Page d'accueil (URL : /)
│
├── Components/
│   ├── __tests__/
│   │   └── Header.test.tsx # Tests unitaires pour le composant Header
│   └── Header.tsx          # Composant Header
│
└── store/
    └── useStore.ts         # Store Zustand pour la gestion d'état
```

## Exécution du projet

Pour démarrer le serveur de développement :

`npm run dev`

Cela lancera l'application sur `http://localhost:3000`.

Pour construire l'application pour la production :

`npm run build`

Pour démarrer la version de production :

`npm run start`

## Tests

Nous utilisons **Jest** et **React Testing Library** pour tester les composants
et la logique de l'application.

### Exécution des tests

Pour exécuter tous les tests :

`npm run test`

Les tests sont situés dans les répertoires `__tests__` adjacents aux composants
ou pages qu'ils testent.

## Thématisation

Ce projet utilise **Material UI** pour la thématisation. Le thème est configuré
dans le fichier `src/app/theme.ts`.

Pour appliquer le thème globalement dans votre application, vous pouvez utiliser
le composant `ThemeProvider` fourni par Material UI dans votre fichier
`src/app/layout.tsx`.

### Application du thème

Dans votre `layout.tsx` :

```typescript
// src/app/layout.tsx
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme'; // Importez votre thème personnalisé

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Réinitialise le style par défaut du navigateur */}
      {children}
    </ThemeProvider>
  );
}
```

### Utilisation du thème dans les composants

Vous pouvez accéder au thème dans n'importe quel composant en utilisant le hook
`useTheme` de Material UI ou en appliquant directement les valeurs du thème via
les composants MUI.

Exemple avec `useTheme` :

```typescript
// src/Components/Header.tsx
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

const Header = () => {
  const theme = useTheme();

  return (
    <header style={{ backgroundColor: theme.palette.primary.main, padding: '1rem' }}>
      <Typography variant="h4" color="secondary">
        Welcome to the Application
      </Typography>
    </header>
  );
};

export default Header;
```

Dans cet exemple, le composant `Header` utilise la couleur principale du thème
pour l'arrière-plan et la couleur secondaire pour le texte. Vous pouvez accéder
à n'importe quelle partie du thème (par exemple, les espacements, la
typographie) de manière similaire avec `useTheme`.

---

## Gestion d'état

Nous utilisons Zustand pour une gestion d'état légère. Le store est situé dans
le fichier `src/store/useStore.ts`.

Exemple de configuration :

```typescript
// src/store/useStore.ts
import create from "zustand";

interface StoreState {
  counter: number;
  increment: () => void;
}

const useStore = create<StoreState>((set) => ({
  counter: 0,
  increment: () => set((state) => ({ counter: state.counter + 1 })),
}));

export default useStore;
```

## Guide de contribution

Nous encourageons tous les contributeurs à suivre les directives énoncées dans
notre document
[CONTRIBUTING.md](https://github.com/ai-cfia/.github/blob/main/profile/CONTRIBUTING.md).

### Fork et Clonage

1. Forkez le dépôt en cliquant sur le bouton "Fork" en haut à droite de la page
   du dépôt.
2. Clonez le dépôt forké sur votre machine locale :

   ```bash
   git clone https://github.com/your-username/your-repo.git
   ```

### Travailler sur une Issue

1. Créez toujours une nouvelle branche pour la fonctionnalité ou la correction
   sur laquelle vous travaillez :

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Apportez vos modifications en veillant à respecter les directives de
   [CONTRIBUTING.md](https://github.com/ai-cfia/.github/blob/main/profile/CONTRIBUTING.md).

3. Exécutez la suite de tests pour vérifier :

   ```bash
   npm run test
   ```

4. Une fois vos modifications terminées, validez-les et poussez-les vers votre
   fork :

   ```bash
   git add .
   git commit -m "Description of your feature/bugfix"
   git push origin feature/your-feature-name
   ```

5. Ouvrez une Pull Request (PR) à partir de votre branche de fonctionnalité, en
   fournissant une description claire des modifications.

### Style de Code

- Suivez les configurations ESLint et Prettier fournies.
- Rédigez des tests unitaires pour votre code.
- Assurez-vous que l'application fonctionne sans erreurs avant de soumettre.

## Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de
détails.
