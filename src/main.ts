import * as core from '@actions/core'
import * as github from '@actions/github'
import {Octokit} from 'octokit'
import {diffIndex} from './git'

const INPUT_GITHUB_TOKEN = 'github_token'

async function run(): Promise<void> {
  const token = core.getInput(INPUT_GITHUB_TOKEN)

  const ctx = github.context

  try {
    console.log('ctx', ctx)
    const octokit = new Octokit({
      auth: token
    })

    const check = await octokit.rest.checks.create({
      ...ctx.repo,
      head_sha: ctx.payload.after,
      name: 'git-changes',
      status: 'in_progress'
    })

    try {
      const {files} = await diffIndex()
      if (files?.length === 0) {
        const r = await octokit.rest.checks.update({
          ...ctx.repo,
          check_run_id: check.data.id,
          conclusion: 'success',
          output: {
            title: 'No changes were found',
            summary: 'The repository has no uncommitted changes.'
          }
        })
        console.log('update files length 0 result', r)
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
      console.log('Uncommited files found:')
      if (files && files.length) {
        for (const f of files) {
          console.log(`- ${f}`)
        }
      }
      process.exitCode = 1
    } catch (e) {
      process.exitCode = 1
      console.error(e)
      const r = await octokit.rest.checks.update({
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
      console.log('update error result', r)
      process.exitCode = 1
    }
  } catch (e: any) {
    process.exitCode = 1
    process.stdout.write('error creating check\n')
    console.error(e)
  }
}

run()
