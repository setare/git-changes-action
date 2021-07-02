import * as core from '@actions/core'
import {exec} from '@actions/exec'
import github from '@actions/github'

const INPUT_GITHUB_TOKEN = 'github_token'

async function run(): Promise<void> {
  const token = core.getInput(INPUT_GITHUB_TOKEN)

  const octokit = github.getOctokit(token)
  const ctx = github.context

  const check = await octokit.rest.checks.create({
    ...ctx.repo,
    head_sha: ctx.sha,
    name: 'git-changes',
    status: 'in_progress'
  })

  try {
    let diffIndexOutput = ''

    const exitCode = await exec(
      'git',
      ['diff-index', '--quiet', 'HEAD', '--'],
      {
        listeners: {
          stdout: (data: Buffer) => {
            diffIndexOutput += data.toString()
          }
        }
      }
    )
    if (exitCode == 0) {
      octokit.rest.checks.update({
        ...ctx.repo,
        check_run_id: check.data.id,
        conclusion: 'success',
        output: {
          title: 'No changes were found',
          summary: 'The repository has no uncommitted changes.'
        }
      })
      return
    }

    const files = diffIndexOutput.split('\n').map(s =>
      s
        .trim()
        .split(/ +/)
        .filter((_, idx) => idx > 4)
        .join(' ')
    )

    octokit.rest.checks.update({
      ...ctx.repo,
      check_run_id: check.data.id,
      conclusion: 'failure',
      output: {
        title: 'Uncommitted changes were found',
        summary: `${files.length} uncommitted files were found`,
        text: `
### Files
${files.map(f => `- ${f}`).join('\n')}
        `
      }
    })
  } catch (e) {
    octokit.rest.checks.update({
      ...ctx.repo,
      check_run_id: check.data.id,
      conclusion: 'failure',
      output: {
        title: 'Check failed',
        summary: 'An error occurred when running the action.',
        text: `
## Exception
${e}
`
      }
    })
  }
}

run()
