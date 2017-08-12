# git-ll

Git commit log, pulling out commit info in the format that the npm cli
project uses.

## Usage

```console
$ npx @iarna/git-ll
```
or

```console
$ npm install -g @iarna/git-ll
$ git ll
```

## Output

Output looks like this:

```
637f2548f^#17748 [#17637] finalize: When rolling back use symlink project-relative path (#17748) (@iarna on 2017-07-12 ↑@zkat)
```

* `637f2548f` - Is the first nine characters of the commit hash, this is the git "short form".
* `^` - If there's a carrot here it means this commit has been peer reviewed (that is, its description has a `Reviewed-By`).
* `#17748 ` - If `PR-URL` is in the description then this is the PR#. If there's more than one then this will be a comma separated list.
* `[#17637]` - If `Fixes` is in the description then this is the issue #. If there's more than one then this will be a comma separated list.
* `finalize: When rolling back use symlink project-relative path (#17748)` - The subject, that is, the first line of the raw commit message.
* `@iarna` - If `Credit` is in the description then this is a comma separated list of those values. If not, this is the Author Name from git.
* `2017-07-12` - The UTC date this was committed.
* `↑@zkat` - If `Reviewed-By` is in the description then its value will be here.
