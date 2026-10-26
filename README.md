# VISTAS

VISTAS is a React application for preparing HIV, HBV, and HCV sequence and treatment data for GenBank submission.

## Software availability and implementation

VISTAS is available at [https://hivdb.stanford.edu/vistas/](https://hivdb.stanford.edu/vistas/). Google Chrome is the supported browser.

The source code is available in this repository.

Sequence analysis sends uploaded sequences to external GraphQL services at `hivdb.stanford.edu`. An internet connection and access to those services are required for the analysis steps.

## Run locally

Use Node.js 18 and Yarn Classic (1.x):

```sh
yarn install
yarn start
```

Open `http://localhost:3000/vistas/`. Build the production bundle with `yarn build`.

## License

MIT. See [LICENSE](LICENSE).

## Contact

For maintenance questions and issue reports, email [hivdbteam@lists.stanford.edu](mailto:hivdbteam@lists.stanford.edu).
