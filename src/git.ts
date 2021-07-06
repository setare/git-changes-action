import {exec} from '@actions/exec'

export const splitFileNames = (lines: string[]): string[] => {
  return lines.map(s => s.substr(3))
}

interface DiffIndexResponse {
  files?: string[]
}

export async function statusPorcelain(): Promise<DiffIndexResponse> {
  const rawLines: string[] = []

  await exec('git', ['status', '--porcelain'], {
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
