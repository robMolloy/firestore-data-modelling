# Firebase Data Modelling

## Copy files from reference project

- Clone reference project: `git clone https://github.com/robMolloy/firebase-data-modelling`
- Install root dependencies: `npm i`
- Install functions dependencies: `cd functions && npm i`

## Run firebase emulator

- `npm run firebase:emulator:export-on-exit`
  - This will not work if the seed file is missing - look at the `firebase-data-modelling` readme to understand more

## Setup Jest

- Initialise jest
  - Add testing packages to the devDependencies with `npm i -D jest ts-jest @firebase/rules-unit-testing @types/jest`
  - Add the following to `package.json` scripts;
    ```
      "test": "jest --detectOpenHandles",
      "test:watch": "jest --watchAll --detectOpenHandles"
    ```
  - Add `jest.config.js` file with the following;
    ```
    // jest.config.js
    module.exports = {
      preset: "ts-jest",
      testEnvironment: "node",
      testMatch: ["**/__tests__/**/*.ts?(x)", "**/?(*.)+(spec|test).ts?(x)"],
      moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
      },
    };
    ```

## Setup basic tests

Once the above is setup, you can start writing tests or use this repo as a starting point for your own tests.
