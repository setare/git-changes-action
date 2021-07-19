import * as core from '@actions/core'
import * as github from '@actions/github'
import {Octokit} from 'octokit'
import {diff, statusPorcelain} from './git'

const DEFAULT_CHECK_NAME = 'git-changes'

const INPUT_GITHUB_TOKEN = 'github_token',
  INPUT_DISABLE_CHECK = 'disable_check',
  INPUT_DISABLE_DIFF = 'disable_diff',
  INPUT_NAME = 'name'

const callIfDisabled = async <T>(
  enabled: boolean,
  f: () => T
): Promise<T | undefined> => {
  if (!enabled) {
    return f()
  }
  return undefined
}

async function run(): Promise<void> {
  const disableCheck = core.getInput(INPUT_DISABLE_CHECK) === 'true'
  const disableDiff = core.getInput(INPUT_DISABLE_DIFF) === 'true'
  const token = core.getInput(INPUT_GITHUB_TOKEN, {
    required: !disableCheck
  })
  const checkName = core.getInput(INPUT_NAME) || DEFAULT_CHECK_NAME

  const ctx = github.context

  try {
    const octokit = await callIfDisabled(
      disableCheck,
      () =>
        new Octokit({
          auth: token
        })
    )

    const checkProps = {
      ...ctx.repo,
      head_sha: ctx.payload.after ?? ctx.sha
    }

    const check = await callIfDisabled(disableCheck, async () =>
      octokit!.rest.checks.create({
        ...checkProps,
        name: checkName,
        status: 'in_progress'
      })
    )

    try {
      const {files} = await statusPorcelain()
      if (files?.length === 0) {
        await callIfDisabled(disableCheck, async () =>
          octokit!.rest.checks.update({
            ...checkProps,
            check_run_id: check!.data.id,
            conclusion: 'success',
            output: {
              title: 'No changes were found',
              summary: 'The repository has no uncommitted changes.'
            }
          })
        )
        return
      }

      let diffMarkdown = '',
        diffRawContent = ''
      if (!disableDiff) {
        const {output} = await diff()
        diffRawContent = output
        diffMarkdown = `
### Diff
${'```'}diff
${diffRawContent}
${'```'}
`
      }

      await callIfDisabled(disableCheck, async () =>
        octokit!.rest.checks.update({
          ...checkProps,
          check_run_id: check!.data.id,
          conclusion: 'failure',
          output: {
            title: 'Uncommitted changes were found',
            summary: `${(files ?? []).length} uncommitted files were found`,
            text: `### Files
${
  (files && files.length && files.map(f => `- ${f}`).join('\n')) ||
  '- No files found'
}
${diffMarkdown}`
          }
        })
      )
      console.log('Uncommited files found:')
      if (files && files.length) {
        for (const f of files) {
          console.log(`- ${f}`)
        }
      }
      if (!disableDiff) {
        console.log('')
        console.log('Diff')
        console.log(diffRawContent)
      }
      process.exitCode = 1
    } catch (e) {
      process.exitCode = 1
      console.error(e)
      await callIfDisabled(disableCheck, async () =>
        octokit!.rest.checks.update({
          ...checkProps,
          check_run_id: check!.data.id,
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
      )
      process.exitCode = 1
    }
  } catch (e: any) {
    process.exitCode = 1
    console.log('error creating check:')
    console.error(e)
  }
}

run()
