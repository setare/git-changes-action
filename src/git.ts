import {exec} from '@actions/exec'

export const splitFileNames = (lines: string[]): string[] => {
  return lines.map(s => s.split('\t')[1])
}

interface DiffIndexResponse {
  files?: string[]
}

export async function diffIndex(): Promise<DiffIndexResponse> {
  const rawLines: string[] = []

  await exec('git', ['diff-index', 'HEAD', '--'], {
    listeners: {
      stdline: data => {
        rawLines.push(data)
      },
      errline: data => {
        rawLines.push(data)
      }
    }
  })

  const files = splitFileNames(rawLines)

  return {
    files
  }
}

export async function diff(): Promise<{output: string}> {
  let output = ''

  await exec('git', ['--no-pager', 'diff'], {
    ignoreReturnCode: true,
    listeners: {
      stdout: data => {
        output += data
      },
      stderr: data => {
        output += data
      }
    }
  })

  return {
    output
  }
}
