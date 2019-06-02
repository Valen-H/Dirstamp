  
# DirStamp  
  
Take stamps of directories with ease!  
  
## Usage  
  
* `dirstamp path/`  
* `dirstamp path/ -j > struct.json`  
  
> Validate current structure out of `.json` struct files with `dirstamp -c struct.json path/`  
  
## Options  
  
* **-p** -- Switch sorting method from `shift` to `push`  
* **-j** -- Print JSON  
* **-s** -- Follow Symlinks  
* **-d \<Number>** -- Max depth (Defaults to Infinity [-1] )  
* **-c \<File>** -- Read a JSON file and compare to current structure  
* **-C** -- Disable colors  
* **-w** -- Override default behaviour and start watching changes instead (ctrl+c to stop) ['rename' might be equal to add/delete]  
* **-h** -- Help screen  
  