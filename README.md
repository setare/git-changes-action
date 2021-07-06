# Checking for uncommitted changes

If you are using generation on your repository and don't want to have release
commits just with generated files, this action can help you to check whether or
not a PR forgets to regenerate the files by checking for uncommitted changes 
after your generation step.

Check the example below:

```yaml
on: pull_request
steps:
  generation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-go@v2
        with:
          go-version: '1.16'
      - uses: bufbuild/buf-setup-action@v0.1.0
        with:
          version: '0.43.2'
      - name: Generating gRPC files
        run: make generate
      - uses: setare/git-changes-action@v0.1.2
        with:
          github_token: ${{ github.token }}
          name: 'File generation check'
```

This action will create a check (if not disabled using `disable_check: 'true'`)
and will report the list of uncommitted files, as well as its diff.

## Inputs

**github_token** _(required)_: Github token to access checks.

**disable_check** _(optional, default 'false')_: Flag that disables the creation of checks.

**disable_diff** _(optional, default 'false')_: Flag that disables the of a diff when uncommitted changes are found.

**name** _(optional, default 'git-changes')_: Name of the check.

## License

MIT