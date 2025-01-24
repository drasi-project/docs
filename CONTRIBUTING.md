# Contributing to Drasi documentation

Thank you for your interesting in contributing to the Drasi documentation!

## Current status

We welcome small pull request contributions from anyone (docs improvements, bug fixes, minor features.) as long as they follow a few guidelines:

- For very minor changes like correcting a typo feel free to send a pull request. Otherwise ... 
- Please start by [opening an issue](https://github.com/drasi-project/docs/issues/new/choose) to work on.
- The maintainers will respond to your issue, please work with the maintainers to ensure that what you're doing is in scope for the project before writing any code.
- If you have any doubt whether a contribution would be valuable, feel free to ask.

## Developer Certificate of Origin

The Drasi project follows the [Developer Certificate of Origin](https://developercertificate.org/). This is a lightweight way for contributors to certify that they wrote or otherwise have the right to submit the code they are contributing to the project.

Contributors sign-off that they adhere to these requirements by adding a Signed-off-by line to commit messages.

```
This is my commit message

Signed-off-by: Random J Developer <random@developer.example.org>
```

Git even has a -s command line option to append this automatically to your commit message:

```
$ git commit -s -m 'This is my commit message'
```

Visual Studio Code has a setting, `git.alwaysSignOff` to automatically add a Signed-off-by line to commit messages. Search for "sign-off" in VS Code settings to find it and enable it.

## Running the spellchecker locally
The docs repository has a GitHub Actions workflow that uses [`pyspelling`](https://facelessuser.github.io/pyspelling/) to check for spelling mistakes. Passing this check is required for all PRs.

To run the spellchecker locally:
1. Install `aspell`
   ```bash
   brew install aspell
   ```
2. Install `pyspelling`
    ```bash
    pip install pyspelling
    ```
3. Run the following command from the root of this repository:
   ```bash
   pyspelling --config .github/config/.pyspelling.yml -n Markdown 
   ```

## Code of conduct

This project has adopted the [Contributor Covenant](http://contributor-covenant.org/).
For more information see [CODE_OF_CONDUCT.md](https://github.com/drasi-project/docs/blob/preview/CODE_OF_CONDUCT.md)
