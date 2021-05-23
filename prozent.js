const percentageDifference = (gekauft, verkauft) => {
    const prozentVonGekauft = (verkauft / gekauft) * 100

    console.log(prozentVonGekauft - 100)
}

percentageDifference(203.43, 202.22)