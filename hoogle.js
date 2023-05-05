function run(argv) {
  function makeItems(results) {
    return results.map((result) => {
      return {
        uid: result.subtitle,
        title: result.name,
        subtitle: result.subtitle,
        arg: result.subtitle,
      }
    })
  }

  function argvToResults(argv) {
    const name = argv.join(' ')
    const query = name.replaceAll(' ', '%20')
    return [
      {
        name: name,
        subtitle: `https://hoogle.haskell.org/?hoogle=${query}`,
      },
    ]
  }

  const oldArgv =
    $.NSProcessInfo.processInfo.environment.objectForKey('oldArgv').js
  const newArgv = JSON.stringify(argv)

  if (newArgv === oldArgv) {
    const oldResults =
      $.NSProcessInfo.processInfo.environment.objectForKey('oldResults').js
    return JSON.stringify({
      rerun: 0.1,
      skipknowledge: true,
      variables: { oldResults: oldResults, oldArgv: oldArgv },
      items: makeItems(argvToResults(argv).concat(JSON.parse(oldResults))),
    })
  }

  const encodedQuery = encodeURIComponent(argv[0])
  const queryURL = $.NSURL.URLWithString(
    `http://www.haskell.org/hoogle/?mode=json&hoogle=${encodedQuery}`
  )
  const response = $.NSData.dataWithContentsOfURL(queryURL)
  const responseString = $.NSString.alloc.initWithDataEncoding(
    response,
    $.NSUTF8StringEncoding
  ).js
  const newResults = JSON.parse(responseString).map((entry) => {
    const entityReference = {
      '&quot;': '"',
      '&amp;': '&',
      '&apos;': "'",
      '&lt;': '<',
      '&gt;': '>',
    }

    return {
      name: Object.keys(entityReference).reduce(
        (acc, cur) => acc.replaceAll(cur, entityReference[cur]),
        entry.item.replace(/(<([^>]+)>)/gi, '')
      ),
      subtitle: entry.url,
    }
  })

  return JSON.stringify({
    skipknowledge: true,
    variables: { oldResults: JSON.stringify(newResults), oldArgv: newArgv },
    items: makeItems(argvToResults(argv).concat(newResults)),
  })
}
