const index = "./src/index.js";
const target_dir = "./dist";
const target = "./dist/SC_test.user.js";

try {
  Deno.mkdirSync(target_dir);
} catch(e) { }
const index_file = Deno.openSync(index, { read: true });
const target_file = Deno.openSync(target, { write: true, create: true, truncate: true });


(function transcribe_userscript_meta(index_file, target_file) {
  // write comments(meta info) until the first non-comment line
  // non-comment line: a line not starting with "//"
  
  const decoder = new TextDecoder("utf-8");
  const buffer_size = 100;
  const buffer = new Uint8Array(buffer_size);
  const regex = /\n[^\/][^\/]/;
  function read_to_buffer() {
    let n = index_file.readSync(buffer);
    let text = decoder.decode(buffer);
    let idx = text.search(regex);
    return [n, text, idx];
  }

  let comment_end = false
  while (!comment_end) {
    let [n, text, idx] = read_to_buffer();
    // console.log(`${n} Btyes\n`, text.slice(0, idx));

    if (n < buffer_size) {
      comment_end = true;
    } 
    if (idx === -1) {
      target_file.writeSync(buffer.slice(0, n));
    } else {
      target_file.writeSync( new TextEncoder().encode(text.slice(0, idx)) );
      comment_end = true;
    }
  }
})(index_file, target_file);

const { files, diagnostics } = await Deno.emit(index, { 
  bundle: "module", 
  compilerOptions: {
    allowJs: true
  }
});
console.log("\ndiagnostics", diagnostics);
const main_content = files["deno:///bundle.js"];

target_file.writeSync( Uint8Array.from([10, 10]) );
target_file.writeSync( new TextEncoder().encode(main_content) );




Deno.close(index_file.rid);
Deno.close(target_file.rid);