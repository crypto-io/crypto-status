const { prompt } = require('inquirer');
const GithubAPI = require('github');
const { write, read } = require('crypto-io-utils');
const github = new GithubAPI()
const watchSet = new Map();

prompt([{
  type: 'input',
  message: 'Github username',
  name: 'username'
}, {
  type: 'password',
  message: 'Github password',
  name: 'password'
}, {
  type: 'input',
  message: 'organization',
  name: 'organization',
  default: 'crypto-io'
}]).then(answers => {
  github.authenticate({
    type: 'basic',
    username: answers.username,
    password: answers.password
  });

  github.repos.getForOrg({org: answers.organization}, (error, repos) => {
    for (const repo of Object.entries(repos.data)) {
      const { name, html_url, updated_at, homepage, language, open_issues, full_name } = repo[1];
      watchSet.set(name, { name, html_url, updated_at, homepage, language, open_issues, full_name })
    }
    github.issues.getForOrg({org: answers.organization}, (error, repos) => {
      for (const repo of Object.entries(repos.data)) {
        const { title, html_url, number, state } = repo[1];
        const name = repo[1].repository.name;
        const obj = watchSet.get(name);
        if (!obj.issues) obj.issues = [];

        obj.issues = [...obj.issues, { title, html_url, number, state }]
        watchSet.set(name, obj);
        read('src/index.html', 'string').then(string => {

          write('dist/index.html', string.replace('const watchSet = []', `const watchSet = ${JSON.stringify([...watchSet], 2, 2)}`));
        });
      }
    });

  });

});
