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
    console.log('octokit initialized')

    const check = await octokit.rest.checks.create({
      ...ctx.repo,
      head_sha: ctx.sha,
      name: 'git-changes',
      status: 'in_progress'
    })

    console.log('check:', check.data, check)

    try {
      const {exitCode, files} = await diffIndex()
      console.log('diffIndex result', {
        exitCode,
        files
      })
      if (exitCode === 0) {
        await octokit.rest.checks.update({
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

      await octokit.rest.checks.update({
        ...ctx.repo,
        check_run_id: check.data.id,
        conclusion: 'failure',
        output: {
          title: 'Uncommitted changes were found',
          summary: `${(files ?? []).length} uncommitted files were found`,
          text: `### Files
${
  (files && files.length && files.map(f => `- ${f}`).join('\n')) ||
  '- No files found'
}
`
        }
      })
    } catch (e) {
      process.exitCode = 1
      console.error(e)
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
  } catch (e: any) {
    process.exitCode = 1
    process.stdout.write('error creating check\n')
    console.error(e)
  }
}

run()
