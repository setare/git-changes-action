import * as core from '@actions/core'
import * as github from '@actions/github'
import {Octokit} from 'octokit'
import {diffIndex} from './git'

const INPUT_GITHUB_TOKEN = 'github_token'

async function run(): Promise<void> {
  const token = core.getInput(INPUT_GITHUB_TOKEN)

  const ctx = github.context

  try {
    const octokit = new Octokit({
      auth: token
    })

    const commitStatusProps = {
      ...ctx.repo,
      sha: ctx.sha
    }

    await octokit.rest.repos.createCommitStatus({
      ...commitStatusProps,
      state: 'pending'
    })

    try {
      const {files} = await diffIndex()

      if (files?.length === 0) {
        await octokit.rest.repos.createCommitStatus({
          ...commitStatusProps,
          state: 'success',
          description: `No changes were found.`
        })
        return
      }

      await octokit.rest.repos.createCommitStatus({
        ...commitStatusProps,
        state: 'failure',
        description: `${(files ?? []).length} uncommitted files were found

### Files
${
  (files && files.length && files.map(f => `- ${f}`).join('\n')) ||
  '- No files found'
}
`
      })
    } catch (e) {
      process.exitCode = 1
      console.error(e)
      await octokit.rest.repos.createCommitStatus({
        ...commitStatusProps,
        state: 'failure',
        description: `An error happened when trying to detected uncommitted files.

\`\`\`
${e}
\`\`\`
`
      })
    }
  } catch (e: any) {
    process.exitCode = 1
    process.stdout.write('error creating check\n')
    console.error(e)
  }
}

run()
