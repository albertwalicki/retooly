/* eslint-disable no-console */
const fs = require('fs');
const shell = require('shelljs');
const setHelpers = require('./setHelpers');

const EXTENSION_TSX = 'tsx';
const EXTENSION_JS = 'js';
const PROJECT_TYPE_REACT = 'react';
const PROJECT_TYPE_REACT_NATIVE = 'react-native';
const STYLING_MODULE_SCSS = 'module.scss';
const STYLING_EMOTION = 'emotion';
const STYLING_STYLED_COMPONENTS = 'styled-components';
const EXTERNAL_STYLES = 'external';
const INTERNAL_STYLES = 'internal';

const CONFIG_PATH = './.retooly.json';

module.exports = function plopMain(plop) {
  const currentPath = process.env.INIT_CWD || './';

  setHelpers(plop);

  let config;
  let packageJson;

  try {
    const data = fs.readFileSync(CONFIG_PATH, {
      encoding: 'utf8',
      flag: 'r',
    });

    config = JSON.parse(data);
  } catch (err) {
    console.log('Config file not found');
  }

  try {
    const data = fs.readFileSync('./package.json', {
      encoding: 'utf8',
      flag: 'r',
    });

    packageJson = JSON.parse(data);
  } catch (err) {
    console.log('package.json not found');
  }

  plop.setGenerator('Component', {
    description: 'Create component in current directory',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Provide component name',
      },
    ],
    actions() {
      const basePath = `${currentPath}/{{name}}`;
      const actions = [];

      let projectType = 'react';

      if (projectType === PROJECT_TYPE_REACT_NATIVE) {
        projectType = 'react-native';
      }

      if (projectType === PROJECT_TYPE_REACT) {
        if (config?.projectType === STYLING_MODULE_SCSS) {
          projectType = 'react-modules';
        } else {
          projectType = 'react';
        }
      }

      actions.push({
        type: 'add',
        path: `${basePath}/index.${config?.extension || 'js'}`,
        templateFile: 'templates/index.hbs',
      });

      actions.push({
        type: 'add',
        path: `${basePath}/{{name}}.${config?.extension || 'js'}`,
        templateFile: `templates/${projectType}.hbs`,
      });

      if (config?.externalStyles === 'external' && config?.styling) {
        let ext;
        switch (config.styling) {
          case STYLING_EMOTION:
          case STYLING_STYLED_COMPONENTS:
            ext = config.extension;
            break;
          default:
            ext = config.styling;
        }

        actions.push({
          type: 'add',
          path: `${basePath}/{{name}}-style.${ext}`,
          templateFile: `templates/style.hbs`,
        });
      }

      actions.push((answers) => {
        if (
          packageJson?.dependencies?.eslint ||
          packageJson?.devDependencies?.eslint
        ) {
          try {
            shell.exec(
              `./node_modules/eslint/bin/eslint.js "${currentPath}/${answers.name}" --fix`
            );
          } catch (err) {
            console.log("Couldn't lint the code");
          }
        }
      });

      return actions;
    },
  });

  plop.setGenerator('Set project config', {
    description: 'Configures project type',
    prompts: [
      {
        type: 'list',
        name: 'extension',
        message: 'Select extension type',
        choices: [EXTENSION_TSX, EXTENSION_JS],
        default: config?.extension ?? [],
      },
      {
        type: 'list',
        name: 'projectType',
        message: 'Select project type',
        choices: [PROJECT_TYPE_REACT, PROJECT_TYPE_REACT_NATIVE],
        default: config?.projectType ?? [],
      },
      {
        type: 'list',
        name: 'styling',
        message: 'Select prefered styling method',
        choices: [
          STYLING_EMOTION,
          STYLING_MODULE_SCSS,
          STYLING_STYLED_COMPONENTS,
        ],
        default: config?.styling ?? [],
      },
      {
        type: 'list',
        name: 'externalStyles',
        message: 'Select if styles should be in an external file',
        choices: [EXTERNAL_STYLES, INTERNAL_STYLES],
        default: config?.externalStyles ?? [],
      },
    ],
    actions: [
      function saveConfig(answers) {
        const updatedConfig = {
          ...(config || {}),
          ...answers,
        };

        try {
          fs.writeFileSync(CONFIG_PATH, JSON.stringify(updatedConfig));
        } catch (err) {
          console.log("Something went wrong. Couldn't save config file: ", err);
        }
      },
    ],
  });
};
