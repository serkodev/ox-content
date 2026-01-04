//! Benchmarks for the Markdown parser.

use criterion::{black_box, criterion_group, criterion_main, Criterion, Throughput};
use ox_content_allocator::Allocator;
use ox_content_parser::Parser;

const SIMPLE_MD: &str = r#"# Hello World

This is a paragraph with some **bold** and *italic* text.

## Second heading

- Item 1
- Item 2
- Item 3

```rust
fn main() {
    println!("Hello!");
}
```
"#;

const LARGE_MD: &str = include_str!("../../../__ubugeeei__/goal.md");

fn bench_parse_simple(c: &mut Criterion) {
    let mut group = c.benchmark_group("parse_simple");
    group.throughput(Throughput::Bytes(SIMPLE_MD.len() as u64));

    group.bench_function("simple_md", |b| {
        b.iter(|| {
            let allocator = Allocator::new();
            let parser = Parser::new(&allocator, black_box(SIMPLE_MD));
            let _ = parser.parse();
        });
    });

    group.finish();
}

fn bench_parse_large(c: &mut Criterion) {
    let mut group = c.benchmark_group("parse_large");
    group.throughput(Throughput::Bytes(LARGE_MD.len() as u64));

    group.bench_function("large_md", |b| {
        b.iter(|| {
            let allocator = Allocator::new();
            let parser = Parser::new(&allocator, black_box(LARGE_MD));
            let _ = parser.parse();
        });
    });

    group.finish();
}

criterion_group!(benches, bench_parse_simple, bench_parse_large);
criterion_main!(benches);
