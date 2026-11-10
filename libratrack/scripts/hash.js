async function main() {
  const bcrypt = await import("bcryptjs");
  const password = "Password123!";
  for (const account of ["admin", "maya", "ethan", "sofia"]) {
    const hash = await bcrypt.hash(password, 12);
    console.log(`${account}: ${hash}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
