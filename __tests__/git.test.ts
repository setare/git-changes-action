import {splitFileNames, diffIndex} from '../src/git'

test('split files from git diff', () => {
  const files = splitFileNames(
    [
    ':100644 100644 374f4895c4c2507a163a5195c51c5a20ac3c530b 0000000000000000000000000000000000000000 M\tfile1',
    ':100644 100644 374f4895c4c2507a163a5195c51c5a20ac3c530b 0000000000000000000000000000000000000000 M\tfile2',
    ]
  )
  expect(files.length).toBe(2)
  expect(files).toEqual(['file1', 'file2'])
})

test('git diff', async () => {
  /*
  const d = await diffIndex();
  expect(d).toEqual({
    files: ['__tests__/git.test.ts', 'src/git.ts']
  })
  */
})
